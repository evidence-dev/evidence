import {
	isValidationContext,
	type Validator,
	containsVariableSyntax,
	getTableFromContext
} from './types';
import { compileMetric } from '../../metrics/compile-metric';

/**
 * Validate a `metric=` reference at edit time: the named metric must exist in the
 * project's metric catalog AND compile cleanly (so a bad calculated-metric
 * definition surfaces here too, not just at runtime). Accepts a single string
 * OR an array of strings (matching the `y` attribute's shape). Skips when the
 * value is a runtime variable, or when there is no catalog in context (e.g.
 * CLI syntax-only) — we can't assert non-existence without a loaded catalog.
 */
export const metricExists =
	(metricAttribute: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const value = node.attributes[metricAttribute];
		if (value === undefined || value === null) return [];

		// A single string with commas is the OLD undocumented shape. Reject it with
		// a clear hint pointing at the array form — silently splitting would collide
		// with metric names that legitimately contain commas.
		if (typeof value === 'string' && value.includes(',')) {
			return [
				{
					id: 'invalid-metric',
					level: 'error',
					message: `${metricAttribute}: comma-separated metric names are not supported. Use an array: ${metricAttribute}=[${value
						.split(',')
						.map((s) => `"${s.trim()}"`)
						.filter((s) => s !== '""')
						.join(', ')}]`,
					location: node.location
				}
			];
		}

		// Normalize both shapes to a list of names. Skip runtime-variable strings.
		let names: string[];
		if (Array.isArray(value)) {
			// Skip validation if any element is a runtime variable — resolves later.
			for (const el of value) {
				if (typeof el === 'string' && containsVariableSyntax(el)) return [];
			}
			names = value
				.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
				.map((v) => v.trim());
		} else if (typeof value === 'string') {
			if (containsVariableSyntax(value)) return [];
			const trimmed = value.trim();
			if (trimmed === '') return [];
			names = [trimmed];
		} else {
			return [];
		}

		const catalog = context.metricsCatalog;
		if (!catalog) return [];

		// First pass: existence + compilation. Track view bases as we go so the
		// second pass can flag cross-base mixes without a second catalog lookup.
		const bases: { name: string; base: string | undefined; baseSql: string | undefined }[] = [];
		for (const name of names) {
			const found = catalog.getMetric(name);
			if (!found) {
				return [
					{
						id: 'invalid-metric',
						level: 'error',
						message: `${metricAttribute}: metric "${name}" is not defined in metrics/*.yaml`,
						location: node.location
					}
				];
			}

			const { errors } = compileMetric(found.view, { metrics: [found.metric.name] }, context.dialect);
			if (errors.length > 0) {
				return [
					{
						id: 'invalid-metric',
						level: 'error',
						message: `${metricAttribute}: ${errors.join('; ')}`,
						location: node.location
					}
				];
			}
			// Metric view's `base:` must be a real table when metadata is available —
			// otherwise the metric silently compiles at edit time and fails at query
			// time with a raw warehouse "table not found" that never points back to
			// the metric YAML. Only checked when the view uses `base:` (not
			// `base_sql:`, which is an inline query we can't introspect) and metadata
			// is loaded — the same lenient guard `tableExists` uses.
			if (found.view.base) {
				const table = getTableFromContext(found.view.base, context);
				if (!table && context.metadata && !context.metadata.loading) {
					return [
						{
							id: 'invalid-metric',
							level: 'error',
							message: `${metricAttribute}: metric "${name}" targets base table "${found.view.base}" which does not exist in the warehouse. Update the metric's \`base:\` in its metrics/*.yaml file, or create the table.`,
							location: node.location
						}
					];
				}
			}
			bases.push({ name, base: found.view.base, baseSql: found.view.baseSql });
		}

		// Cross-base mix in a multi-metric array: `resolveMetricChart` currently
		// drops any metric whose view base doesn't match the first, so a chart with
		// `metric=["revenue","signups"]` from different bases silently loses series
		// with no runtime signal. Flag at edit time and point at combo_chart, which
		// runs one query per child and IS the supported path for cross-base.
		if (bases.length > 1) {
			const first = bases[0];
			const mismatch = bases.find(
				(b) => b.base !== first.base || b.baseSql !== first.baseSql
			);
			if (mismatch) {
				const firstBase = first.base ?? '(inline base_sql)';
				const otherBase = mismatch.base ?? '(inline base_sql)';
				return [
					{
						id: 'invalid-metric',
						level: 'error',
						message: `${metricAttribute}: metric "${mismatch.name}" (base "${otherBase}") can't share a chart with "${first.name}" (base "${firstBase}"). Use combo_chart with per-child metric= to combine metrics from different bases.`,
						location: node.location
					}
				];
			}
		}

		return [];
	};
