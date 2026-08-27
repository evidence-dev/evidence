import { describe, it, expect } from 'vitest';
import { schema as tableSchema } from './schema';

describe('Table Cross-Filtering & Row Drilldown', () => {
	it('includes cross_filter attributes in table schema', () => {
		expect(tableSchema.attributes.cross_filter).toBeDefined();
		expect(tableSchema.attributes.cross_filter_column).toBeDefined();
		expect(tableSchema.attributes.cross_filter_multiple).toBeDefined();
	});
});
