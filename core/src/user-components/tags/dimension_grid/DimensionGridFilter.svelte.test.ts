// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { DimensionGridFilter } from './DimensionGridFilter.svelte';
import {
	BigQueryDialect,
	ClickHouseDialect,
	PostgresDialect,
	type SqlDialect
} from '../../../sql-dialect';

function makeGrid(attributes: Record<string, unknown> = {}, dialect?: SqlDialect) {
	return new DimensionGridFilter(
		{ id: 'grid', userComponentName: 'dimension_grid', attributes } as never,
		{ url: undefined, updateUrl: undefined, projectSettings: undefined, dialect }
	);
}

describe('DimensionGridFilter sql-context default', () => {
	it('a bare {{id}} in SQL resolves the predicate, never the selected object', () => {
		const filter = makeGrid();
		filter.setDefault({ region: 'West' });
		const prop = DimensionGridFilter.defaultProperty.sql;
		const value = filter.templateValues[prop];
		expect(String(value)).not.toContain('[object');
		expect(typeof value).toBe('string');
	});
});

describe('DimensionGridFilter.predicateSql', () => {
	it('emits = for a scalar and IN for a list, joined with AND', () => {
		const filter = makeGrid();
		filter.setDefault({ category: ['Electronics', 'Clothing'], region: 'West' });
		expect(filter.predicateSql(new ClickHouseDialect())).toBe(
			"category IN ('Electronics', 'Clothing') AND region = 'West'"
		);
	});

	it('collapses a single-element list to =', () => {
		const filter = makeGrid();
		filter.setDefault({ category: ['Electronics'] });
		expect(filter.predicateSql(new ClickHouseDialect())).toBe("category = 'Electronics'");
	});

	it('escapes values with the passed dialect', () => {
		const filter = makeGrid();
		filter.setDefault({ name: "O'Brien" });
		expect(filter.predicateSql(new ClickHouseDialect())).toBe("name = 'O\\'Brien'");
		expect(filter.predicateSql(new PostgresDialect())).toBe("name = 'O''Brien'");
	});

	it('quotes a non-simple identifier with the passed dialect', () => {
		const filter = makeGrid();
		filter.setDefault({ 'order date': 'x' });
		expect(filter.predicateSql(new ClickHouseDialect())).toBe('"order date" = \'x\'');
		expect(filter.predicateSql(new BigQueryDialect())).toBe("`order date` = 'x'");
	});

	it('rejects a dimension key containing a backslash (injection guard)', () => {
		const filter = makeGrid();
		filter.setDefault({ 'a\\b': 'x' });
		expect(filter.predicateSql(new ClickHouseDialect())).toBeUndefined();
	});

	it('honors the _dimensionColumns allowlist', () => {
		const filter = makeGrid({ _dimensionColumns: ['category'] });
		filter.setDefault({ category: 'A', secret: 'B' });
		expect(filter.predicateSql(new ClickHouseDialect())).toBe("category = 'A'");
	});

	it('contributes no predicate when there are no selections', () => {
		const filter = makeGrid();
		expect(filter.predicateSql(new ClickHouseDialect())).toBeUndefined();
	});
});
