import type { Column } from '../../user-components/interfaces/query-service';
import { getDatabricksToJsType } from './type-mapping';

// Minimal, SDK-agnostic column shape. The Studio client / CLI build these from
// the driver's result schema (translating the Thrift TTypeId into `typeName`),
// so core needs no @databricks/sql dependency.
export type DatabricksColumnMeta = {
	position: number;
	columnName: string;
	typeName: string;
	nullable?: boolean;
};

// Map the driver's result-set schema into Evidence columns, ordered by position
// to match SELECT order.
export function mapDatabricksColumns(columns: DatabricksColumnMeta[]): Column[] {
	return [...columns]
		.sort((a, b) => a.position - b.position)
		.map((col) => ({
			name: col.columnName,
			clickhouseType: col.typeName,
			jsType: getDatabricksToJsType(col.typeName),
			...(typeof col.nullable === 'boolean' ? { nullable: col.nullable } : {})
		}));
}

// Hive/Spark Thrift TTypeId → friendly Databricks type name (fed to
// getDatabricksToJsType). The enum is stable across driver versions. Kept in
// core so the Studio client and the CLI adapter share one source of truth.
const TTYPE_ID_TO_NAME: Record<number, string> = {
	0: 'BOOLEAN',
	1: 'TINYINT',
	2: 'SMALLINT',
	3: 'INT',
	4: 'BIGINT',
	5: 'FLOAT',
	6: 'DOUBLE',
	7: 'STRING',
	8: 'TIMESTAMP',
	9: 'BINARY',
	10: 'ARRAY',
	11: 'MAP',
	12: 'STRUCT',
	13: 'STRING',
	14: 'STRING',
	15: 'DECIMAL',
	16: 'STRING',
	17: 'DATE',
	18: 'VARCHAR',
	19: 'CHAR',
	20: 'INTERVAL',
	21: 'INTERVAL',
	22: 'TIMESTAMP'
};

/**
 * Map a `@databricks/sql` result-set schema (`operation.getSchema()`, a Thrift
 * `TTableSchema`) into Evidence columns. Reads only plain fields off the object
 * so core needs no driver dependency; both the Studio client and the CLI adapter
 * call in with the same shape.
 */
export function columnsFromResultSchema(schema: unknown): Column[] {
	const cols = (schema as { columns?: unknown[] } | null)?.columns;
	if (!Array.isArray(cols)) return [];
	const metas: DatabricksColumnMeta[] = cols.map((c, i) => {
		const col = c as {
			columnName?: string;
			position?: number;
			typeDesc?: { types?: { primitiveEntry?: { type?: number } }[] };
		};
		const typeId = col.typeDesc?.types?.[0]?.primitiveEntry?.type;
		return {
			position: col.position ?? i,
			columnName: col.columnName ?? `col_${i}`,
			typeName: (typeId !== undefined && TTYPE_ID_TO_NAME[typeId]) || 'unknown'
		};
	});
	return mapDatabricksColumns(metas);
}
