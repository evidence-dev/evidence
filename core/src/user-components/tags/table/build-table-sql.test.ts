import { describe, expect, it } from 'vitest';
import { buildTableSQLConfig } from './build-table-sql';
import { processColumnExpression } from '../../common/sql-expression-utils';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import {
	ClickHouseDialect,
	SnowflakeDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect
} from '../../../sql-dialect';

describe.each([
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect(),
	new MotherDuckDialect()
])('table limit sort precedence ($name)', (dialect) => {
	function columns(): UnifiedColumnDefinition[] {
		return [
			{ value: 'category', type: 'dimension' as const },
			{ value: 'sum(total_sales)', type: 'measure' as const },
			{ value: 'count(*)', type: 'measure' as const }
		].map((input, index) => {
			const expression = processColumnExpression(input, dialect);
			return {
				...expression,
				type: input.type,
				columnIdForRendering: expression.alias,
				processedColumnExpression: expression,
				sort: index === 1 ? 'desc' : index === 2 ? 'asc' : undefined
			};
		});
	}

	it.each(['sparkline', 'comparison', 'pivot'] as const)(
		'does not fall through a first %s sort to a later ordinary sort',
		(kind) => {
			const unifiedColumns = columns();
			if (kind === 'sparkline') unifiedColumns[1].viz = 'sparkline';
			if (kind === 'comparison') {
				unifiedColumns[1].columnIdForRendering = `${unifiedColumns[1].alias}_pct`;
			}
			if (kind === 'pivot') {
				const expression = processColumnExpression({ value: 'region', type: 'pivot' }, dialect);
				unifiedColumns.splice(1, 0, {
					...expression,
					type: 'pivot',
					columnIdForRendering: expression.alias,
					processedColumnExpression: expression
				});
			}

			const config = buildTableSQLConfig({
				data: 'demo.daily_orders',
				unifiedColumns,
				limit: 5,
				dialect
			});
			expect(config.order).toBeUndefined();
		}
	);

	it('pushes down the first ordinary sort, even when a later column also sorts', () => {
		const unifiedColumns = columns();
		const config = buildTableSQLConfig({
			data: 'demo.daily_orders',
			unifiedColumns,
			limit: 5,
			dialect
		});
		expect(config.order).toBe(`${dialect.quoteAlias(unifiedColumns[1].alias)} desc`);
	});

	it('preserves explicit order when the first sort cannot be pushed down', () => {
		const unifiedColumns = columns();
		unifiedColumns[1].viz = 'sparkline';
		const config = buildTableSQLConfig({
			data: 'demo.daily_orders',
			unifiedColumns,
			limit: 5,
			dialect,
			order: 'category asc'
		});
		expect(config.order).toBe('category asc');
	});
});
