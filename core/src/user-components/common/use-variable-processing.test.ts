import { describe, it, expect, vi } from 'vitest';
import {
	createVariableProcessor,
	processPropsFromSchema,
	processProp,
	processStandardProps
} from './use-variable-processing';
import type { UserComponentSchema, UserComponentAttribute } from '../types';
import type { VariableProcessor } from '../../filter-variables/VariableProcessor';
import { NumberVariable, BooleanVariable } from './zod-attribute';

/**
 * Helper to create a minimal valid schema for testing.
 * Uses type assertion since we only need the attributes for processPropsFromSchema.
 */
function createTestSchema(attributes: Record<string, UserComponentAttribute>): UserComponentSchema {
	return {
		render: 'TestComponent',
		attributes
	} as UserComponentSchema;
}

/**
 * Tests for the variable processing utilities.
 *
 * These utilities provide a consistent way to process variables in component props:
 *
 * - createVariableProcessor(): Creates a VariableProcessor from filter contexts
 * - processPropsFromSchema(): Schema-driven processing for all variable-supporting props
 * - processProp(): Process a single prop with a specified context
 * - processStandardProps(): Process common standard props (title, where, date_range, etc.)
 *
 * Key concepts:
 * - supportsVariables: Schema attribute flag that enables variable processing
 * - variableContext: Explicit context override ('sql', 'text', 'column')
 * - suggestionType: Used for context inference when variableContext not set
 * - Type coercion: NumberVariable and BooleanVariable types trigger automatic coercion
 */

// Helper to create a mock VariableProcessor
function createMockProcessor(
	processStringFn: (value: string, context: string) => string = (v) => v
): VariableProcessor {
	return {
		processString: vi.fn(processStringFn),
		validateString: vi.fn(() => [])
	} as unknown as VariableProcessor;
}

describe('processPropsFromSchema', () => {
	describe('basic processing', () => {
		it('returns props unchanged when no processor provided', () => {
			const schema = createTestSchema({
				title: { type: String, supportsVariables: true }
			});

			const props = { title: '{{filter}}' };
			const result = processPropsFromSchema(props, schema, null);

			expect(result).toEqual(props);
			expect(result).toBe(props); // Same reference when no processing
		});

		it('only processes attributes with supportsVariables: true', () => {
			const processor = createMockProcessor((v) => v.replace('{{x}}', 'X'));

			const schema = createTestSchema({
				title: { type: String, supportsVariables: true },
				id: { type: String } // No supportsVariables
			});

			const props = { title: '{{x}}', id: '{{x}}' };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.title).toBe('X'); // Processed
			expect(result.id).toBe('{{x}}'); // Not processed
		});

		it('skips processing for props not present in input', () => {
			const processor = createMockProcessor((v) => v.replace('{{x}}', 'X'));

			const schema = createTestSchema({
				title: { type: String, supportsVariables: true },
				subtitle: { type: String, supportsVariables: true }
			});

			const props = { title: '{{x}}' }; // subtitle not provided
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.title).toBe('X');
			expect('subtitle' in result).toBe(false);
		});

		it('preserves non-variable-supporting props unchanged', () => {
			const processor = createMockProcessor(() => 'PROCESSED');

			const schema = createTestSchema({
				title: { type: String, supportsVariables: true },
				multiple: { type: Boolean }
			});

			const props = { title: 'hello', multiple: true };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.title).toBe('PROCESSED');
			expect(result.multiple).toBe(true);
		});
	});

	describe('context inference', () => {
		it('uses explicit variableContext when provided', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				customProp: {
					type: String,
					supportsVariables: true,
					variableContext: 'sql'
				}
			});

			const props = { customProp: 'test' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('test', 'sql');
		});

		it('uses sql context for where, having, order, qualify attributes', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				where: { type: String, supportsVariables: true },
				having: { type: String, supportsVariables: true },
				order: { type: String, supportsVariables: true },
				qualify: { type: String, supportsVariables: true }
			});

			const props = { where: 'w', having: 'h', order: 'o', qualify: 'q' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('w', 'sql');
			expect(processor.processString).toHaveBeenCalledWith('h', 'sql');
			expect(processor.processString).toHaveBeenCalledWith('o', 'sql');
			expect(processor.processString).toHaveBeenCalledWith('q', 'sql');
		});

		it('uses column context for suggestionType sql/column/dateColumn', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				x: { type: String, supportsVariables: true, suggestionType: 'sql' },
				y: { type: String, supportsVariables: true, suggestionType: 'column' },
				date: { type: String, supportsVariables: true, suggestionType: 'dateColumn' }
			});

			const props = { x: 'a', y: 'b', date: 'c' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('a', 'column');
			expect(processor.processString).toHaveBeenCalledWith('b', 'column');
			expect(processor.processString).toHaveBeenCalledWith('c', 'column');
		});

		it('uses text context as default', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				title: { type: String, supportsVariables: true },
				info: { type: String, supportsVariables: true }
			});

			const props = { title: 'a', info: 'b' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('a', 'text');
			expect(processor.processString).toHaveBeenCalledWith('b', 'text');
		});

		it('explicit variableContext overrides attribute name inference', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				// 'where' would normally get 'sql' context, but we override it
				where: { type: String, supportsVariables: true, variableContext: 'text' }
			});

			const props = { where: 'test' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('test', 'text');
		});

		it('explicit variableContext overrides suggestionType inference', () => {
			const processor = createMockProcessor();

			const schema = createTestSchema({
				// suggestionType 'sql' would give 'column', but we override it
				value: {
					type: String,
					supportsVariables: true,
					suggestionType: 'sql',
					variableContext: 'text'
				}
			});

			const props = { value: 'test' };
			processPropsFromSchema(props, schema, processor);

			expect(processor.processString).toHaveBeenCalledWith('test', 'text');
		});
	});

	describe('type coercion', () => {
		it('coerces NumberVariable types to numbers', () => {
			const processor = createMockProcessor(() => '42');

			const schema = createTestSchema({
				bin_count: { type: NumberVariable, supportsVariables: true }
			});

			const props = { bin_count: '{{count}}' };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.bin_count).toBe(42);
			expect(typeof result.bin_count).toBe('number');
		});

		it('coerces BooleanVariable types to booleans', () => {
			const processor = createMockProcessor(() => 'true');

			const schema = createTestSchema({
				showLegend: { type: BooleanVariable, supportsVariables: true }
			});

			const props = { showLegend: '{{show}}' };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.showLegend).toBe(true);
			expect(typeof result.showLegend).toBe('boolean');
		});

		it('handles NumberVariable in arrays', () => {
			const processor = createMockProcessor(() => '10');

			const schema = createTestSchema({
				value: { type: [NumberVariable], supportsVariables: true }
			});

			const props = { value: '{{num}}' };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.value).toBe(10);
		});

		it('leaves non-numeric strings as strings when coercing to number', () => {
			const processor = createMockProcessor(() => 'not-a-number');

			const schema = createTestSchema({
				count: { type: NumberVariable, supportsVariables: true }
			});

			const props = { count: '{{x}}' };
			const result = processPropsFromSchema(props, schema, processor);

			expect(result.count).toBe('not-a-number');
		});
	});

	describe('type preservation', () => {
		it('preserves the input type in the return type', () => {
			const processor = createMockProcessor((v) => v.toUpperCase());

			interface MyProps {
				title?: string;
				count?: number;
			}

			const schema = createTestSchema({
				title: { type: String, supportsVariables: true }
			});

			const props: MyProps = { title: 'hello', count: 42 };
			const result = processPropsFromSchema(props, schema, processor);

			// TypeScript should infer result as MyProps
			expect(result.title).toBe('HELLO');
			expect(result.count).toBe(42);
		});
	});
});

describe('processProp', () => {
	it('processes a string with the specified context', () => {
		const processor = createMockProcessor((v, ctx) => `${v}[${ctx}]`);

		const result = processProp('test', processor, 'sql');
		expect(result).toBe('test[sql]');
	});

	it('returns value unchanged when no processor', () => {
		const result = processProp('{{filter}}', null, 'text');
		expect(result).toBe('{{filter}}');
	});

	it('processes objects recursively', () => {
		const processor = createMockProcessor((v) => v.replace('{{x}}', 'X'));

		const result = processProp({ a: '{{x}}', b: { c: '{{x}}' } }, processor, 'text');
		expect(result).toEqual({ a: 'X', b: { c: 'X' } });
	});
});

describe('processStandardProps', () => {
	it('processes all standard props with correct contexts', () => {
		const processor = createMockProcessor((v, ctx) => `${v}[${ctx}]`);

		const props = {
			data: 'myTable',
			title: 'My Title',
			subtitle: 'My Subtitle',
			info: 'Info text',
			info_link: '/link',
			info_link_title: 'Link Title',
			where: 'status = active',
			having: 'count > 0',
			order: 'date DESC',
			qualify: 'row_num = 1',
			date_range: { range: 'last 30 days', date: 'created_at' },
			date_grain: 'day'
		};

		const result = processStandardProps(props, processor);

		// Data and title props use 'text' context
		expect(result.data).toBe('myTable[text]');
		expect(result.title).toBe('My Title[text]');
		expect(result.subtitle).toBe('My Subtitle[text]');
		expect(result.info).toBe('Info text[text]');
		expect(result.info_link).toBe('/link[text]');
		expect(result.info_link_title).toBe('Link Title[text]');

		// SQL props use 'sql' context
		expect(result.where).toBe('status = active[sql]');
		expect(result.having).toBe('count > 0[sql]');
		expect(result.order).toBe('date DESC[sql]');
		expect(result.qualify).toBe('row_num = 1[sql]');

		// Date props use 'text' context
		expect(result.date_range).toEqual({
			range: 'last 30 days[text]',
			date: 'created_at[text]'
		});
		expect(result.date_grain).toBe('day[text]');
	});

	it('handles missing optional props gracefully', () => {
		const processor = createMockProcessor((v) => v);

		const props = { title: 'Only Title' };
		const result = processStandardProps(props, processor);

		expect(result.title).toBe('Only Title');
		expect(result.data).toBeUndefined();
		expect(result.where).toBeUndefined();
		expect(result.date_range).toBeUndefined();
	});

	it('returns empty strings for missing title props', () => {
		const processor = createMockProcessor((v) => v);

		const props = {};
		const result = processStandardProps(props, processor);

		expect(result.title).toBe('');
		expect(result.subtitle).toBe('');
		expect(result.info).toBe('');
	});
});

describe('createVariableProcessor', () => {
	// Note: These tests use mocked dependencies since we can't easily create
	// real Filters and InlineQueries instances in unit tests

	it('returns null when inlineQueries is missing', () => {
		const result = createVariableProcessor([undefined, undefined], undefined);
		expect(result).toBeNull();
	});

	it('returns null when filterContexts are all undefined', () => {
		const mockInlineQueries = {} as unknown as Parameters<typeof createVariableProcessor>[1];
		const result = createVariableProcessor([undefined, undefined], mockInlineQueries);
		expect(result).toBeNull();
	});

	it('accepts positional arguments', () => {
		// This test verifies the function signature works with positional args
		// Actual processor creation requires real dependencies
		const result = createVariableProcessor([undefined], undefined);
		expect(result).toBeNull();
	});

	it('accepts object argument syntax', () => {
		// This test verifies the function signature works with object syntax
		const result = createVariableProcessor({
			filterContexts: [undefined],
			inlineQueries: undefined
		});
		expect(result).toBeNull();
	});
});

describe('integration: variable processing workflow', () => {
	/**
	 * This section demonstrates the complete workflow for adding variable support
	 * to a component, serving as documentation for engineers.
	 */

	it('demonstrates complete variable processing for a chart component', () => {
		// Step 1: Create a mock processor that simulates filter resolution
		const processor = createMockProcessor((value) => {
			// Simulate different filter values
			if (value === '{{category_filter}}') return 'Electronics';
			if (value === '{{metric}}') return 'sum(total_sales)';
			if (value === '{{date_range}}') return 'last 30 days';
			if (value === '{{where_clause}}') return "region = 'North'";
			return value;
		});

		// Step 2: Define schema with supportsVariables on relevant attributes
		const chartSchema = createTestSchema({
			// Data source - supports variables
			data: { type: String, supportsVariables: true, variableContext: 'text' },

			// Column expressions - use 'column' context for unquoted values
			category: {
				type: String,
				supportsVariables: true,
				suggestionType: 'sql',
				variableContext: 'column'
			},
			value: {
				type: String,
				supportsVariables: true,
				suggestionType: 'sql',
				variableContext: 'column'
			},

			// Display props - use 'text' context
			title: { type: String, supportsVariables: true },

			// SQL clause - uses 'sql' context (inferred from name)
			where: { type: String, supportsVariables: true },

			// Non-variable props
			legend: { type: Boolean }
		});

		// Step 3: Component props (as they come from Markdoc)
		const props = {
			data: 'sales_data',
			category: '{{category_filter}}',
			value: '{{metric}}',
			title: 'Sales by Category',
			where: '{{where_clause}}',
			legend: true
		};

		// Step 4: Process all props using schema
		const processed = processPropsFromSchema(props, chartSchema, processor);

		// Step 5: Verify results
		expect(processed.data).toBe('sales_data');
		expect(processed.category).toBe('Electronics');
		expect(processed.value).toBe('sum(total_sales)');
		expect(processed.title).toBe('Sales by Category');
		expect(processed.where).toBe("region = 'North'");
		expect(processed.legend).toBe(true); // Unchanged, doesn't support variables
	});

	it('demonstrates nested object processing for BigValue comparison', () => {
		const processor = createMockProcessor((value) => {
			if (value === '{{compare_type}}') return 'previous_period';
			if (value === '{{target}}') return '1000';
			if (value === '{{custom_text}}') return 'vs last month';
			return value;
		});

		const schema = createTestSchema({
			comparison: {
				type: Object,
				supportsVariables: true
			}
		});

		const props = {
			comparison: {
				compare_vs: '{{compare_type}}',
				target: '{{target}}',
				text: '{{custom_text}}',
				down_is_good: false
			}
		};

		const processed = processPropsFromSchema(props, schema, processor);

		expect(processed.comparison).toEqual({
			compare_vs: 'previous_period',
			target: '1000',
			text: 'vs last month',
			down_is_good: false
		});
	});

	it('demonstrates NumberVariable for histogram bin_count', () => {
		const processor = createMockProcessor((value) => {
			if (value === '{{slider}}') return '20';
			return value;
		});

		const schema = createTestSchema({
			bin_count: { type: NumberVariable, supportsVariables: true }
		});

		const props = { bin_count: '{{slider}}' };
		const processed = processPropsFromSchema(props, schema, processor);

		// Value is coerced to number
		expect(processed.bin_count).toBe(20);
		expect(typeof processed.bin_count).toBe('number');
	});
});
