import { describe, expect, it, vi } from 'vitest';
import {
	dialectFor,
	SnowflakeDialect,
	type SqlDialect,
	type WarehouseType
} from '../../../../sql-dialect';
import { TableModel } from '../TableModel.svelte';
import { DimensionModel } from './DimensionModel.svelte';

function makeDimension(dialect: SqlDialect, conditionalColors: string) {
	const parent = Object.create(TableModel.prototype) as TableModel;
	Object.defineProperty(parent, 'variableProcessor', { value: null });
	return new DimensionModel({
		attributes: {
			value: 'project_status',
			conditional_colors: conditionalColors,
			hide: false,
			html: false,
			link_new_tab: false
		},
		validationErrors: [],
		parent,
		deps: {
			connection: {
				id: 'default',
				type: 'managed',
				dialect,
				query: vi.fn()
			},
			filterContexts: undefined,
			inlineQueries: undefined,
			projectSettings: undefined,
			defaultRefreshInterval: undefined
		}
	});
}

const WAREHOUSES: WarehouseType[] = [
	'snowflake',
	'bigquery',
	'clickhouse',
	'fabric',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
];

describe('dimension conditional colors', () => {
	it.each([
		["'#EEEDFE'", "ANY_VALUE('#EEEDFE')"],
		[
			"case when project_status is not null then '#EEEDFE' else null end",
			"ANY_VALUE(case when project_status is not null then '#EEEDFE' else null end)"
		]
	])('formats the Snowflake helper alias for %s', (conditionalColors, expectedExpression) => {
		const model = makeDimension(new SnowflakeDialect(), conditionalColors);

		expect(model.conditionalColorsMeasure).toMatchObject({
			sqlWithAlias: `${expectedExpression} AS "__CC_PROJECT_STATUS"`,
			alias: '__CC_PROJECT_STATUS',
			columnIdForRendering: '__CC_PROJECT_STATUS',
			hide: true
		});
		expect(model.dimension).toMatchObject({
			color_options: { conditional_colors: '__CC_PROJECT_STATUS' },
			fragmentColumnAliases: ['__CC_PROJECT_STATUS']
		});
	});

	// Consumers re-derive column names through the dialect (search predicates, comparisons), so an
	// alias that is not already in the dialect's own casing resolves to a column the SELECT never made.
	it.each(WAREHOUSES)('emits a helper alias that survives re-formatting on %s', (warehouse) => {
		const dialect = dialectFor(warehouse);
		const alias = makeDimension(dialect, "'#EEEDFE'").conditionalColorsMeasure?.alias;

		expect(alias).toBeDefined();
		expect(dialect.formatAlias(alias!)).toBe(alias);
	});
});
