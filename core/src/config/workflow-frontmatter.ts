import { z } from 'zod';
import {
	PERIOD_GRAINS,
	DEFAULT_PERIOD_COUNT,
	DEFAULT_PERIOD_GRAIN,
	MAX_PERIOD_COUNT,
	isPeriodGrain
} from '../user-components/common/reporting-periods';

export const workflowPeriodSchema = z.object({
	grain: z
		.enum(PERIOD_GRAINS)
		.optional()
		.catch(undefined)
		.describe('The calendar grain each reporting period covers. Defaults to `month`.'),
	periods: z
		.number()
		.int()
		.min(1)
		.max(MAX_PERIOD_COUNT)
		.optional()
		.catch(undefined)
		.describe(
			`How many complete periods the picker offers (1-${MAX_PERIOD_COUNT}). Defaults to 12.`
		)
});

/**
 * The `workflow:` frontmatter block. `period` is nested rather than top-level
 * so release cadence and drafts can join it later. There is no `enabled` flag:
 * the presence of `workflow.period` is the switch.
 */
export const workflowSchema = z.object({
	period: workflowPeriodSchema
		.nullable()
		.optional()
		.catch(undefined)
		.describe(
			'Turn this page into a periodic report. Adds a period picker and a `period` variable.'
		)
});

export type WorkflowPeriodConfig = z.infer<typeof workflowPeriodSchema>;

type FrontmatterLike = { workflow?: unknown } | undefined | null;

function periodBlock(frontmatter: FrontmatterLike): unknown {
	if (!frontmatter || typeof frontmatter !== 'object') return undefined;
	const workflow = (frontmatter as { workflow?: unknown }).workflow;
	if (!workflow || typeof workflow !== 'object') return undefined;
	const period = (workflow as { period?: unknown }).period;
	// `period:` with nothing under it parses to null, which still means "on".
	return period === null ? {} : period;
}

/** The page's period config, or undefined if it isn't a periodic report. */
export function parseWorkflowPeriod(
	frontmatter: FrontmatterLike
): WorkflowPeriodConfig | undefined {
	const period = periodBlock(frontmatter);
	if (!period || typeof period !== 'object') return undefined;
	return workflowPeriodSchema.parse(period);
}

export type WorkflowWarning = { id: string; level: 'warning'; message: string };

/**
 * Author-facing warnings. The schema's `.catch(undefined)` degrades a bad value
 * to its default rather than breaking the page, so a typo is otherwise silent.
 */
export function workflowPeriodWarnings(frontmatter: FrontmatterLike): WorkflowWarning[] {
	const period = periodBlock(frontmatter);
	if (!period || typeof period !== 'object') return [];

	const { grain, periods } = period as { grain?: unknown; periods?: unknown };
	const warnings: WorkflowWarning[] = [];

	if (grain !== undefined && !isPeriodGrain(grain)) {
		warnings.push({
			id: 'workflow-period-unknown-grain',
			level: 'warning',
			message: `workflow.period.grain "${String(grain)}" is not a reporting grain and will fall back to "${DEFAULT_PERIOD_GRAIN}". Valid grains: ${PERIOD_GRAINS.join(', ')}.`
		});
	}

	// A rejected value is dropped to undefined by the schema, so the picker shows
	// the default count — not the nearest legal one.
	if (typeof periods === 'number' && (!Number.isInteger(periods) || periods < 1)) {
		warnings.push({
			id: 'workflow-period-invalid-count',
			level: 'warning',
			message: `workflow.period.periods must be a whole number of at least 1; "${periods}" will fall back to ${DEFAULT_PERIOD_COUNT} periods.`
		});
	} else if (typeof periods === 'number' && periods > MAX_PERIOD_COUNT) {
		warnings.push({
			id: 'workflow-period-count-too-large',
			level: 'warning',
			message: `workflow.period.periods cannot exceed ${MAX_PERIOD_COUNT}; "${periods}" will fall back to ${DEFAULT_PERIOD_COUNT} periods.`
		});
	}

	return warnings;
}
