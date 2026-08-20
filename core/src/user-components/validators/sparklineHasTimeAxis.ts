import { containsVariableSyntax, isValidationContext, type Validator } from './types';

/**
 * A sparkline needs a time axis. Raw mode requires `x`; metric mode auto-selects
 * the view's `date` (still overrideable), so `x` is only missing there when the
 * view declares no date. Warns rather than errors so a missing axis on this
 * optional decoration doesn't blank the whole component (any non-warning blocks).
 */
export const sparklineHasTimeAxis =
	(
		sparklineAttribute: string = 'sparkline',
		metricAttribute: string = 'metric',
		dateRangeAttribute: string = 'date_range'
	): Validator =>
	(node, _config, context) => {
		const sparkline = node.attributes[sparklineAttribute];
		if (!sparkline || typeof sparkline !== 'object') return [];
		const s = sparkline as Record<string, unknown>;

		// An explicit x, or a date from either date_range, satisfies the axis.
		if (s.x) return [];
		const sparklineDate = (s.date_range as Record<string, unknown> | undefined)?.date;
		const componentDate = (
			node.attributes[dateRangeAttribute] as Record<string, unknown> | undefined
		)?.date;
		if (sparklineDate || componentDate) return [];

		const metric = node.attributes[metricAttribute];
		if (!metric) {
			return [
				{
					id: 'sparkline-requires-x',
					level: 'warning',
					message: `${sparklineAttribute}: an \`x\` column is required (the sparkline's time axis). Add \`x\` to the sparkline, or a \`date_range\` with a \`date\`.`,
					location: node.location
				}
			];
		}

		// Metric mode auto-selects the view's date, so only warn when the view has
		// none. Stay lenient (like metricExists) without a catalog or a variable ref.
		if (!isValidationContext(context) || !context.metricsCatalog) return [];
		if (typeof metric !== 'string' || containsVariableSyntax(metric)) return [];
		const found = context.metricsCatalog.getMetric(metric.trim());
		if (!found) return []; // metricExists reports the bad reference itself.
		if (found.metric.date ?? found.view.date) return [];

		return [
			{
				id: 'sparkline-requires-x',
				level: 'warning',
				message: `${sparklineAttribute}: metric "${metric.trim()}" has no \`date\` in its view, so the sparkline has no time axis to auto-select. Add \`date:\` to the metric view, or set \`x\` on the sparkline.`,
				location: node.location
			}
		];
	};
