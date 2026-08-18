<script lang="ts">
	import { getPageFiltersContext } from '../../page-filters-context';
	import { getInlineQueriesContext } from '../common/inline-queries';
	import { VariableProcessor } from '../../filter-variables/VariableProcessor';
	import { getRepeatContext } from '../tags/repeat/repeat-context';
	import { logger } from '../../shims/logger';

	interface Props {
		// The template expression without the double curlies (e.g., "filter.selected")
		expression: string;
	}

	let { expression }: Props = $props();

	// Get contexts - include repeat context for filters inside repeat blocks
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// Create variable processor with multiple filter contexts
	// Repeat filters take precedence over page filters (searched first)
	const variableProcessor = $derived.by(() => {
		if (!inlineQueries) return null;

		// Build filter contexts array - repeat filters first for precedence
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0) return null;

		return new VariableProcessor(filterContexts, inlineQueries);
	});

	// Process the template expression reactively
	const value = $derived.by(() => {
		// If no processor available (shouldn't happen in normal usage), show error state
		if (!variableProcessor) {
			return '[ReactiveVariable: No processor]';
		}

		// If expression is empty/invalid, show error state
		if (!expression || !expression.trim()) {
			return '[ReactiveVariable: Empty expression]';
		}

		// Reconstruct the template syntax and process it
		const template = `{{${expression}}}`;
		try {
			// Use 'text' context since ReactiveVariable is used for text rendering in markdown
			return variableProcessor.processString(template, 'text');
		} catch (err) {
			logger.warn({ expression, err }, 'Failed to process variable');
			return template;
		}
	});
</script>

{value}
