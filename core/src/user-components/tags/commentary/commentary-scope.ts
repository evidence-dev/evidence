import type { Filter } from '../../../Filter.svelte';
import type { Filters } from '../../../Filters.svelte';
import { WORKFLOW_PERIOD_FILTER_ID } from '../../common/reporting-periods';
import { PeriodFilter, getWorkflowPeriodFilter } from '../workflow_period/PeriodFilter.svelte';

const SCOPE_INPUT_COMPONENTS = [
	'dropdown',
	'button_group',
	'input_tabs',
	'toggle',
	'period_selector'
] as const;

/** Must stay within the API's limit (MAX_SCOPE_INPUTS in the comments route). */
const MAX_SCOPE_INPUTS = 8;

export function parseCommentaryScope(scope: unknown): string[] {
	const ids = Array.isArray(scope) ? scope : [scope ?? 'page'];
	return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== 'page'))];
}

export function commentaryScopeError(
	ids: string[],
	filters: Filters | undefined
): string | undefined {
	if (ids.filter((id) => id !== WORKFLOW_PERIOD_FILTER_ID).length > MAX_SCOPE_INPUTS) {
		return `Commentary scope can include at most ${MAX_SCOPE_INPUTS} inputs besides period.`;
	}
	for (const id of ids) {
		if (id === WORKFLOW_PERIOD_FILTER_ID) {
			if (!getWorkflowPeriodFilter(filters)) {
				return 'Commentary scoped to period requires workflow.period in the page frontmatter.';
			}
			continue;
		}
		const filter = filters?.get(id);
		if (!filter) return `Commentary scope: input "${id}" does not exist on this page.`;
		if (!(SCOPE_INPUT_COMPONENTS as readonly string[]).includes(filter.userComponentName)) {
			return `Commentary scope: input "${id}" can't be used. Use a dropdown, button_group, input_tabs, toggle, or period_selector.`;
		}
		if (filter.attributes.multiple === true) {
			return `Commentary scope: input "${id}" allows multiple selections. Use a single-select input.`;
		}
	}
	return undefined;
}

export function commentaryScopeValue(filter: Filter | undefined): string | undefined {
	// An unset period means "the newest complete one", which moves over time; key on the resolved period.
	if (filter instanceof PeriodFilter) return filter.period.key;
	return filter?.serializedValue;
}
