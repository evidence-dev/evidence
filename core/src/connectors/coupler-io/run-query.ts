/**
 * Runs Evidence SQL against Coupler.io datasets.
 *
 * Each catalog table is one dataset. A statement may read at most one of them:
 * the query endpoint runs DuckDB SQL against a single dataset snapshot (as the
 * table `data`), so the statement is sent to that dataset with a typed CTE
 * named after the table (see ./sql). The schema-browser catalog statements
 * (../../metadata/coupler-io-catalog) are answered from the API without SQL.
 */

import type { Column } from '../../user-components/interfaces/query-service';
import { isCouplerIoCatalogSql } from '../../metadata/coupler-io-catalog';
import { normalizeDateRows } from '../postgres/normalize-date-rows';
import {
	CouplerIoApiError,
	DatasetNotQueryableError,
	type CouplerIoClient,
	type CouplerIoResult
} from './client';
import {
	columnsFromDescribe,
	expandTableCommand,
	findTableRefs,
	inferColumns,
	typedViewSql,
	withTableCte,
	type CouplerIoViewColumn
} from './sql';

const MAX_AUTO_DISCOVERED_SCHEMAS = 50;

async function catalogResult(
	client: CouplerIoClient,
	kind: 'tables' | 'columns'
): Promise<CouplerIoResult> {
	const catalog = [...(await client.catalog()).values()];
	if (kind === 'tables') {
		return {
			rows: catalog.map((t) => ({ name: t.name, rows: t.rowsCount })),
			columns: [
				{ name: 'name', clickhouseType: 'VARCHAR', jsType: 'string' },
				{ name: 'rows', clickhouseType: 'BIGINT', jsType: 'number' }
			]
		};
	}
	// One Show Dataset call per table, queued at low priority: the client paces
	// them within a share of the rate limit and lets page queries go first. An
	// auto-discovered workspace can hold up to 200 datasets, so only the newest
	// ones are described; the rest stay queryable and listed by `evidence tables`.
	const autoDiscovered = Object.keys(client.config.tables).length === 0;
	const described = autoDiscovered ? catalog.slice(0, MAX_AUTO_DISCOVERED_SCHEMAS) : catalog;
	if (described.length < catalog.length) {
		console.warn(
			`[coupler-io] the schema browser shows columns for the ${described.length} most recently refreshed of ${catalog.length} datasets. Add a \`datasets:\` map to connection.yaml to choose them.`
		);
	}
	const columnsByTable = await Promise.all(
		described.map((table) =>
			client.viewColumns(table.datasetId, 'low').catch((e: unknown) => {
				// An unreadable dataset shouldn't hide the rest of the catalog; auth,
				// rate-limit, and server errors should.
				const skippable =
					e instanceof DatasetNotQueryableError ||
					(e instanceof CouplerIoApiError && e.status === 404);
				if (!skippable) throw e;
				console.warn(
					`[coupler-io] skipping table "${table.name}" in the schema: ${(e as Error).message}`
				);
				return [] as CouplerIoViewColumn[];
			})
		)
	);
	const rows: Record<string, unknown>[] = [];
	for (const [i, table] of described.entries()) {
		for (const c of columnsByTable[i]) {
			rows.push({ tableName: table.name, columnName: c.name, columnType: c.duckType });
		}
	}
	return {
		rows,
		columns: ['tableName', 'columnName', 'columnType'].map((name) => ({
			name,
			clickhouseType: 'VARCHAR',
			jsType: 'string' as const
		}))
	};
}

/** Run one statement (or a catalog sentinel) through `client`. Rows are the caller's to mutate. */
export async function runCouplerIoQuery(
	client: CouplerIoClient,
	sql: string
): Promise<CouplerIoResult> {
	const catalogKind = isCouplerIoCatalogSql(sql);
	if (catalogKind) return catalogResult(client, catalogKind);

	const catalog = await client.catalog();
	if (catalog.size === 0) {
		throw new Error(
			`Coupler.io: no queryable datasets in workspace ${client.config.workspaceId}. Add a \`datasets:\` map to connection.yaml.`
		);
	}

	// `DESCRIBE t` / `SUMMARIZE t` read t like a FROM does.
	const expanded = expandTableCommand(sql);
	const tableNames = [...catalog.values()].map((t) => t.name);
	const { refs, unknown } = findTableRefs(expanded, tableNames);
	if (unknown.length > 0) {
		throw new Error(
			`Coupler.io: no table named ${unknown.map((n) => `"${n}"`).join(', ')}. Tables: ${tableNames.join(', ')}. Read a dataset by its table name (not \`data\`).`
		);
	}
	if (refs.length > 1) {
		throw new Error(
			`Coupler.io can only query one dataset per statement, but this one reads ${refs.join(', ')}. Join the datasets in a Coupler.io dataflow instead.`
		);
	}

	let statement = expanded;
	let datasetId: string;
	let knownTypes = new Map<string, string>();
	if (refs.length === 1) {
		const table = catalog.get(refs[0].toLowerCase())!;
		datasetId = table.datasetId;
		const columns = await client.viewColumns(datasetId);
		statement = withTableCte(expanded, table.name, typedViewSql(columns));
		knownTypes = new Map(columns.map((c) => [c.name, c.duckType]));
	} else {
		// Reads no table at all (e.g. `select 1`): any dataset can host the statement.
		datasetId = catalog.values().next().value!.datasetId;
	}

	const result = await client.cachedResult(datasetId, statement, () =>
		runStatement(client, datasetId, statement, knownTypes)
	);
	// Callers may mutate rows; hand each one its own copy of the cached result.
	return { rows: result.rows.map((r) => ({ ...r })), columns: result.columns };
}

// Evidence's column probe: `SELECT * FROM (…) alias WHERE 1=0`.
const ZERO_ROW_PROBE_RE = /\bWHERE\s+1\s*=\s*0\s*$/i;

async function runStatement(
	client: CouplerIoClient,
	datasetId: string,
	statement: string,
	knownTypes: ReadonlyMap<string, string>
): Promise<CouplerIoResult> {
	// A probe has no rows by construction, so skip straight to DESCRIBE.
	if (ZERO_ROW_PROBE_RE.test(statement)) {
		const described = await client.query(datasetId, `DESCRIBE ${statement}`);
		return { rows: [], columns: columnsFromDescribe(described.rows ?? []) };
	}

	const result = await client.query(datasetId, statement);
	const rows = result.rows ?? [];
	if (result.truncated) {
		console.warn(
			'[coupler-io] result truncated to 10,000 rows — aggregate, filter, or add LIMIT for a complete result.'
		);
	}

	let columns: Column[] = inferColumns(rows, knownTypes);
	// Values can't type a column with no rows or only nulls (e.g. a filter that
	// matches nothing); ask DuckDB for the result schema instead.
	if (columns.length === 0 || columns.some((c) => c.jsType === 'unknown')) {
		const described = await client.query(datasetId, `DESCRIBE ${statement}`);
		columns = columnsFromDescribe(described.rows ?? []);
	}

	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	normalizeDateRows(rows, dateColumns);

	return { rows, columns };
}
