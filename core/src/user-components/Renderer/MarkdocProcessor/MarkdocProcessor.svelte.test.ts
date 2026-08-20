import { afterEach, describe, expect, it, vi } from 'vitest';
import { Filters } from '../../../Filters.svelte';
import { InlineQueries } from '../../common/inline-queries';
import type { ValidationContext } from '../../validators/types';
import { MarkdocProcessor } from './MarkdocProcessor.svelte';

function context(inlineQueries: InlineQueries): ValidationContext {
	return {
		metadata: undefined,
		filters: undefined,
		inlineQueries,
		trees: undefined
	};
}

afterEach(() => {
	vi.useRealTimers();
});

describe('MarkdocProcessor inline query registration', () => {
	it('updates an edited query body before the debounced transform runs', async () => {
		vi.useFakeTimers();
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const processor = new MarkdocProcessor({
			content: '```sql orders\nSELECT bad_col FROM demo.daily_orders\n```',
			validationContext: context(inlineQueries),
			debounceMs: 200
		});
		await vi.advanceTimersByTimeAsync(200);
		expect(inlineQueries.getRaw('orders')).toContain('bad_col');

		processor.markdown = '```sql orders\nSELECT date FROM demo.daily_orders\n```';

		expect(inlineQueries.getRaw('orders')).toContain('SELECT date');
	});

	// A partial's fence is only in the transform tree, so the immediate pass must
	// not reconcile removals — it would drop that query on every keystroke.
	it('leaves a query the page markdown does not contain registered', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined }, { shared: 'SELECT 2' });
		const processor = new MarkdocProcessor({
			content: '```sql orders\nSELECT 1\n```',
			validationContext: context(inlineQueries),
			debounceMs: 200
		});

		processor.markdown = '```sql orders\nSELECT 3\n```';

		expect(inlineQueries.getAllNames().slice().sort()).toEqual(['orders', 'shared']);
	});

	it('does not register non-SQL fences as inline queries', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		new MarkdocProcessor({
			content: '```javascript example\nconsole.log("hello")\n```',
			validationContext: context(inlineQueries),
			debounceMs: 200
		});

		expect(inlineQueries.getAllNames()).toEqual([]);
	});
});

describe('MarkdocProcessor validation context updates', () => {
	// The editor swaps in a private filter store while a page preview owns the shared one.
	// Registration only happens during parse, so without a reparse the new store is empty
	// and every filter the edited file defines validates as missing.
	it('re-registers filters when the validation context swaps the filter store', () => {
		const newFilters = () =>
			new Filters({
				url: new URL('https://example.com/edit'),
				updateUrl: undefined,
				projectSettings: undefined,
				dialect: undefined
			});
		const swappedIn = newFilters();
		const processor = new MarkdocProcessor({
			content: `{% dropdown id="category" initial_value="Groceries" /%}
{% table data="orders" filters=["category"] /%}
{% table data="orders" filters=["ghost"] /%}`,
			validationContext: {
				...context(new InlineQueries({ filterContexts: undefined })),
				filters: newFilters()
			},
			standaloneFileType: 'partial'
		});

		processor.updateValidationContext({ filters: swappedIn });

		expect(swappedIn.filterIds).toEqual(['category']);
		expect(processor.validationErrors.map((error) => error.error?.message)).toEqual([
			'filters: Filter "ghost" does not exist'
		]);
	});
});
