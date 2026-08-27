import { describe, it, expect } from 'vitest';
import { schema } from './schema';

describe('MetricCard Tag', () => {
	it('has valid schema attributes', () => {
		expect(schema.render).toBe('metric_card');
		expect(schema.category).toBe('component');
		expect(schema.attributes.data).toBeDefined();
		expect(schema.attributes.value).toBeDefined();
		expect(schema.attributes.value_fmt).toBeDefined();
		expect(schema.attributes.title).toBeDefined();
		expect(schema.attributes.comparison).toBeDefined();
		expect(schema.attributes.sparkline_date).toBeDefined();
		expect(schema.attributes.badge).toBeDefined();
		expect(schema.attributes.down_is_good).toBeDefined();
	});
});
