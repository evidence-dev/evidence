import type { UserComponentSchema } from '../../types';
import { PERIOD_CONFIG_ATTRIBUTES, PERIOD_FILTER_PROPERTIES } from '../period_selector/schema';

/**
 * Not an authorable tag — `registerFiltersFromAST` synthesizes this from
 * frontmatter. It exists as a user component only so the filter has a
 * registered name: `Filters.deserialize` resolves classes through
 * `getFilterClassByUserComponentName`, so an unregistered filter would not
 * survive the SSR round-trip.
 */
export const schema = {
	render: 'workflow_period',
	category: 'input',
	selfClosing: true,
	undocumented: true,
	description: 'Reporting period selected on a workflow report (declared in frontmatter)',
	attributes: {
		id: {
			type: String,
			required: true,
			description: 'The id of the reporting period variable',
			affectsQuery: false
		},
		...PERIOD_CONFIG_ATTRIBUTES
	},
	filterProperties: PERIOD_FILTER_PROPERTIES,
	componentWrapper: false
} as const satisfies UserComponentSchema;
