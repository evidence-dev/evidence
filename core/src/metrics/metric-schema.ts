import { z } from 'zod';
import yaml from 'js-yaml';

/**
 * Schema + parser for a single **metrics view** (one `metrics/*.yaml` file): a
 * table's dimensions + metrics. Pure and IO-free so it runs client-side
 * (editor validation, autocomplete) and server-side (ingest, commit/publish
 * gate, chat tools) from one source.
 *
 * A **metric** is the single referenceable number (a named aggregation over the
 * view's base, with filter/fmt/synonyms). Metric names are flat and
 * globally unique across views (enforced by the catalog, not here).
 *
 * v1 is single-table — joins across views are not modeled. Reserved metric
 * `type`s (ratio/derived/…) are rejected with a coming-later message.
 */

export type MetricViewDimension = {
	name: string;
	/** Column or expression (raw SQL against the base). */
	source: string;
};

export type Metric = {
	name: string;
	sql: string;
	filter?: string;
	fmt?: string;
	synonyms?: string[];
	description?: string;
	/** Human-readable display name; defaults to a prettified metric name when unset. */
	label?: string;
	/** Per-metric time-column override; falls back to the view's `date`. */
	date?: string;
};

export type MetricsView = {
	base?: string;
	baseSql?: string;
	/** Default time column for the view (the default x for time-series charts). */
	date?: string;
	/**
	 * Default date grain applied when a chart doesn't set `date_grain=`. Named
	 * `default_date_grain:` in YAML to make the default-ness explicit (a bare
	 * `grain:` reads ambiguously as "this view is locked to this grain").
	 */
	defaultDateGrain?: string;
	dimensions: MetricViewDimension[];
	metrics: Metric[];
};

export type ParseMetricsViewResult = { view?: MetricsView; errors: string[] };

/**
 * A calculated (derived) metric composes other metrics by name using `{name}`
 * references, e.g. `sql: "{revenue} / {order_count}"`. At compile time each
 * reference is expanded to the referenced metric's aggregate (macro-expansion),
 * so ratios / derived metrics are just SQL over other metrics — there is no
 * separate metric "type". Single-brace `{name}` is used precisely so it can't
 * collide with Evidence's double-brace `{{ variable }}` syntax; the
 * lookbehind/lookahead makes the matcher skip a `{{name}}` so it is never
 * mistaken for a metric ref (NOTE: `{{ }}` interpolation is not itself wired
 * through the metric layer — compiled metric SQL is not run through the
 * variable processor — so a `{{ … }}` inside a metric's `sql`/`filter` reaches
 * the warehouse verbatim today).
 */
const METRIC_REF_SOURCE = String.raw`(?<!\{)\{([A-Za-z_][A-Za-z0-9_]*)\}(?!\})`;

/**
 * Dotted `{view.metric}` — reserved shape for cross-view references. Not yet
 * supported; detected here so the author gets a clear "not supported yet"
 * error at parse time instead of the bare-{name} regex ignoring it and the
 * literal string reaching the warehouse as a ClickHouse syntax error.
 */
const CROSS_VIEW_REF_SOURCE = String.raw`(?<!\{)\{([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)\}(?!\})`;

/** A fresh global matcher — never share one instance (stateful `lastIndex` breaks recursion). */
export function metricRefRegex(): RegExp {
	return new RegExp(METRIC_REF_SOURCE, 'g');
}

function crossViewRefRegex(): RegExp {
	return new RegExp(CROSS_VIEW_REF_SOURCE, 'g');
}

/** Names of the metrics referenced by a metric's `sql` (empty for a plain aggregate). */
export function extractMetricRefs(sql: string): string[] {
	return [...sql.matchAll(metricRefRegex())].map((m) => m[1]);
}

/** Dotted `{view.metric}` shapes found in `sql` — for cross-view "not supported yet" reporting. */
export function extractCrossViewRefs(sql: string): string[] {
	return [...sql.matchAll(crossViewRefRegex())].map((m) => m[1]);
}

/** True when a metric's `sql` composes other metrics (a calculated/derived metric). */
export function isCalculatedMetric(sql: string): boolean {
	return extractMetricRefs(sql).length > 0;
}

/**
 * Return every cycle in a metric reference graph. Reports ALL cycles (not just
 * the first) so a file with two independent bad pairs surfaces both — and so
 * per-metric error isolation can flag every member cleanly.
 */
function findAllMetricCycles(graph: Map<string, string[]>): string[][] {
	const state = new Map<string, 'visiting' | 'done'>();
	const stack: string[] = [];
	const cycles: string[][] = [];
	const seenCycleKeys = new Set<string>();
	const visit = (node: string): void => {
		state.set(node, 'visiting');
		stack.push(node);
		for (const next of graph.get(node) ?? []) {
			if (state.get(next) === 'visiting') {
				const cycle = [...stack.slice(stack.indexOf(next)), next];
				// Deduplicate: same cycle can be reached from different entry points.
				// Rotate to a canonical form (start at the min-name) so a↔b and b↔a match.
				const rotated = canonicalCycle(cycle);
				const key = rotated.join('→');
				if (!seenCycleKeys.has(key)) {
					seenCycleKeys.add(key);
					cycles.push(cycle);
				}
			} else if (!state.has(next)) {
				visit(next);
			}
		}
		stack.pop();
		state.set(node, 'done');
	};
	for (const node of graph.keys()) {
		if (!state.has(node)) visit(node);
	}
	return cycles;
}

/**
 * The classic YAML footgun: `fmt: #,##0.0` — an unquoted value beginning
 * with `#` is a comment, so the key resolves to `null` and zod reports an
 * opaque "expected string, received null". When we spot that shape in the
 * source for a metric's field, return a "quote it" hint we append to the
 * schema error — one source of truth for editor squiggles AND AI tools.
 */
function findCommentGotcha(
	content: string,
	metricName: string,
	field: string
): string | undefined {
	const lines = content.split('\n');
	// Walk from the metric key downward to find `<field>: #...` within the block.
	// Bare regex is enough here — we don't need a real YAML AST to spot the
	// pattern authored on one line, and this only runs when zod already failed.
	const keyPattern = new RegExp(`^\\s*${metricName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*:`);
	const start = lines.findIndex((l) => keyPattern.test(l));
	if (start < 0) return undefined;
	const fieldPattern = new RegExp(`^(\\s*)${field}\\s*:\\s+(#.*)$`);
	for (let i = start + 1; i < lines.length; i++) {
		const m = lines[i].match(fieldPattern);
		if (!m) continue;
		return ` — the value \`${m[2].trim()}\` starts with \`#\`, which YAML reads as a comment (so the value is empty). Quote it, e.g. \`${field}: "${m[2].trim()}"\`.`;
	}
	return undefined;
}

function canonicalCycle(cycle: string[]): string[] {
	// Drop the trailing repeat, rotate to start at the lexicographically-smallest
	// node so a→b→a and b→a→b canonicalize to the same key.
	const body = cycle.slice(0, -1);
	const minIdx = body.reduce((min, n, i) => (n < body[min] ? i : min), 0);
	return [...body.slice(minIdx), ...body.slice(0, minIdx)];
}

const metricSchema = z
	.object({
		sql: z
			.string()
			.min(1)
			.optional()
			.describe(
				'Aggregate SQL (e.g. `sum(amount)`), or a formula over other metrics using {name} references (e.g. `{revenue} / {orders}`).'
			),
		// Predicate compiled INTO the aggregate (FILTER/CASE WHEN), never a global WHERE
		// — lets divergent-filter metrics share one query/grain.
		filter: z
			.string()
			.optional()
			.describe('Predicate compiled into the aggregate (simple metrics only).'),
		fmt: z.string().optional().describe('Display format, e.g. `usd`, `pct1`, `num0`.'),
		label: z
			.string()
			.optional()
			.describe('Human-readable display name (used as the default title in components).'),
		synonyms: z
			.array(z.string())
			.optional()
			.describe('Alternate names to help the AI assistant match this metric.'),
		description: z.string().optional().describe('What this metric measures.'),
		date: z.string().optional().describe("Per-metric time column; falls back to the view's `date`.")
	})
	.passthrough();

/**
 * Zod shape of one metrics view. Exported for the editor's schema-driven YAML
 * autocomplete (`config-completion-schemas.ts`) in addition to parsing.
 *
 * Note: `metrics` is validated as `record<string, unknown>` at the outer level
 * so a single bad-schema metric (e.g. an unquoted `#` in `fmt:` reading as a
 * YAML comment → `null`, or a stray unknown field) doesn't invalidate the whole
 * file. `parseMetricsView` validates each metric entry against `metricSchema`
 * individually and reports per-metric errors alongside the sibling metrics
 * that DID parse — same isolation model as the semantic checks below.
 */
export const metricsViewSchema = z
	.object({
		base: z.string().min(1).optional().describe('Base table or view to aggregate.'),
		base_sql: z.string().min(1).optional().describe('Inline base query, used instead of `base`.'),
		date: z
			.string()
			.optional()
			.describe('Default time column for the view (the default x-axis for time-series charts).'),
		default_date_grain: z
			.string()
			.optional()
			.describe(
				'Default date grain (day/week/month/quarter/year) applied when a chart omits `date_grain=`. Named `default_` so it is clear this is an override-able default, not a lock on the view.'
			),
		dimensions: z
			.record(z.string(), z.string())
			.optional()
			.describe('Columns to slice by (name: source expression).'),
		metrics: z
			.record(z.string(), z.unknown())
			.describe('Named metrics; each is a single referenceable number.')
	})
	.passthrough();

/**
 * A version of the view schema WITH full per-metric shape validation, exported
 * for the editor's schema-driven YAML autocomplete (`config-completion-schemas.ts`).
 * Not used by `parseMetricsView` — that one validates metrics individually to
 * isolate errors — but the autocomplete uses this to advertise metric fields.
 */
export const metricsViewSchemaStrict = metricsViewSchema.extend({
	metrics: z
		.record(z.string(), metricSchema)
		.describe('Named metrics; each is a single referenceable number.')
});

/**
 * A metric object's inferred type — validated per-entry inside parseMetricsView,
 * so we hand it around as its parsed shape rather than `unknown`.
 */
type ParsedMetric = z.infer<typeof metricSchema>;

export function parseMetricsView(content: string): ParseMetricsViewResult {
	let raw: unknown;
	try {
		raw = yaml.load(content);
	} catch (e) {
		return { errors: [e instanceof Error ? e.message : 'Invalid YAML.'] };
	}

	const result = metricsViewSchema.safeParse(raw);
	if (!result.success) {
		// Prefix each issue with its dotted path (e.g. `metrics.revenue.fmt`) so
		// the message names the offending key — both readable on its own and
		// locatable to a line by the editor's squiggle painter.
		return {
			errors: result.error.issues.map((i) => {
				const path = i.path.filter((p) => typeof p === 'string').join('.');
				return path ? `${path}: ${i.message}` : i.message;
			})
		};
	}
	const data = result.data;
	const errors: string[] = [];

	const hasBase = data.base !== undefined;
	const hasBaseSql = data.base_sql !== undefined;
	if (hasBase && hasBaseSql) {
		errors.push('A metrics view must set exactly one of `base` or `base_sql`, not both.');
	} else if (!hasBase && !hasBaseSql) {
		errors.push('A metrics view must set a `base` table or a `base_sql` query.');
	}

	const rawMetricEntries = Object.entries(data.metrics ?? {});
	if (rawMetricEntries.length === 0) {
		errors.push('A metrics view must define at least one metric.');
	}

	// Per-metric errors, keyed by metric name. A metric with any entry here gets
	// dropped from the compiled view — but sibling metrics in the same file stay
	// valid. Keeps one bad definition (typo, bad ref, cycle member, unquoted-#
	// footgun) from taking every other metric in a shared file offline, which
	// matters on multi-author metrics files where a single edit shouldn't be a
	// whole-file outage.
	const badMetrics = new Map<string, string[]>();
	const flagMetric = (name: string, message: string) => {
		const existing = badMetrics.get(name);
		if (existing) existing.push(message);
		else badMetrics.set(name, [message]);
	};

	// Validate each metric entry INDIVIDUALLY against `metricSchema` — the outer
	// schema treats `metrics` as `record<string, unknown>` so one bad shape doesn't
	// invalidate the whole file. Each metric that passes gets threaded downstream;
	// each that fails is flagged as bad and dropped from the compiled view.
	// Emit the error with the FULL dotted zod path (`metrics.<name>.<field>:`) so
	// the editor's `locateError` can walk to the exact offending line — matching
	// on just the metric name would anchor every error to the metric key line,
	// not the bad `fmt:` / `sql:` line the author needs to fix.
	const metricEntries: [string, ParsedMetric][] = [];
	for (const [name, raw] of rawMetricEntries) {
		const parsed = metricSchema.safeParse(raw);
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				const fieldPath = issue.path.filter((p) => typeof p === 'string').join('.');
				const path = fieldPath ? `metrics.${name}.${fieldPath}` : `metrics.${name}`;
				// Enrich the classic `fmt: #,##0.0` footgun so both the editor
				// squiggle path AND the AI-tool error surface (list_metrics /
				// get_metric / debug_code) get the same actionable "quote it" hint.
				// Previously the hint lived only in studio's validate-metrics-yaml;
				// AI tools returned raw zod text and the docs promise didn't match.
				const hint = fieldPath
					? findCommentGotcha(content, name, fieldPath.split('.')[0])
					: undefined;
				flagMetric(name, `${path}: ${issue.message}${hint ?? ''}`);
			}
			continue;
		}
		metricEntries.push([name, parsed.data]);
	}

	// A metric is either a plain aggregate (`sql: sum(amount)`) or a calculated
	// metric that composes others (`sql: "{revenue} / {orders}"`). There is no
	// metric `type` field — ratios/derived metrics are just `{name}` references
	// in `sql`. Any `type:` value (including `simple`) is rejected so migrators
	// from other layers get a clear hint instead of a silent no-op.
	for (const [name, m] of metricEntries) {
		const declaredType = (m as { type?: unknown }).type;
		if (declaredType !== undefined) {
			flagMetric(
				name,
				`Metric "${name}": \`type\` is not a supported field. Write a ratio/derived metric as a formula in \`sql\` using {name} references (e.g. sql: "{revenue} / {orders}").`
			);
		} else if (!m.sql) {
			flagMetric(name, `Metric "${name}" must define \`sql\`.`);
		}
	}

	// `{{ variable }}` interpolation ISN'T wired inside metric sql/filter —
	// compiled metric SQL bypasses the variable processor, so a `{{ … }}` in
	// a metric definition reaches the warehouse verbatim and fails with an
	// opaque "unknown identifier" error. Detect at parse time and tell the
	// author the supported path (filter reactivity comes from the component's
	// own `filters=`/`where=`, not from metric-internal interpolation).
	const doubleBraceVar = /\{\{[^}]+\}\}/;
	for (const [name, m] of metricEntries) {
		if (m.sql && doubleBraceVar.test(m.sql)) {
			flagMetric(
				name,
				`Metric "${name}": \`{{ variable }}\` interpolation isn't supported inside metric \`sql\` — compiled metric SQL doesn't run through the variable processor. Move filter reactivity to the component (\`filters=\`/\`where=\`) instead.`
			);
		}
		if (m.filter && doubleBraceVar.test(m.filter)) {
			flagMetric(
				name,
				`Metric "${name}": \`{{ variable }}\` interpolation isn't supported inside metric \`filter\` — compiled metric SQL doesn't run through the variable processor. Move filter reactivity to the component (\`filters=\`/\`where=\`) instead.`
			);
		}
	}

	// Calculated (derived) metrics compose others via `{name}` refs. Validate the
	// reference graph at parse time so authors get edit-time errors: refs must
	// resolve to a metric in THIS view (cross-view refs are deferred), a calculated
	// metric cannot also carry a `filter` (filter the referenced metrics instead),
	// and the graph must be acyclic.
	const metricNames = new Set(metricEntries.map(([name]) => name));
	const refGraph = new Map<string, string[]>();
	for (const [name, m] of metricEntries) {
		if (!m.sql) continue;
		// Dotted `{view.metric}` refs are the reserved shape for cross-view
		// references — not supported in v1. Detect them explicitly so the
		// author gets a clear parse-time error instead of the string leaking
		// to the warehouse as literal text and failing with a syntax error.
		for (const dotted of extractCrossViewRefs(m.sql)) {
			flagMetric(
				name,
				`Metric "${name}" uses \`{${dotted}}\` — cross-view metric references (\`{view.metric}\`) aren't supported yet. Move the referenced metric into this view, or wait for cross-view refs to land in a later release.`
			);
		}
		const refs = extractMetricRefs(m.sql);
		if (refs.length === 0) continue;
		if (m.filter) {
			flagMetric(
				name,
				`Metric "${name}": \`filter\` is only supported on simple metrics — filter the metrics it references instead.`
			);
		}
		for (const ref of refs) {
			if (!metricNames.has(ref)) {
				flagMetric(
					name,
					`Metric "${name}" references "${ref}", which is not a metric in this view (cross-view references are not yet supported).`
				);
			}
		}
		refGraph.set(
			name,
			refs.filter((r) => metricNames.has(r))
		);
	}
	for (const cycle of findAllMetricCycles(refGraph)) {
		const trail = cycle.join(' → ');
		// One error per member so each cycle metric gets its own anchored squiggle;
		// mentions the other members so the author sees the whole loop at a glance
		// and knows which `{ref}` in this metric's sql is the one to remove.
		const members = cycle.slice(0, -1);
		for (const name of members) {
			const others = members.filter((n) => n !== name);
			// Self-reference (`sql: "{self} * 2"`) is a length-1 "cycle" with no
			// distinct other member — special-case the copy so it doesn't render
			// as "…forms a cycle with : self → self. Remove one of the {undefined} references".
			if (others.length === 0) {
				flagMetric(
					name,
					`Metric "${name}" references itself in its own \`sql\` (\`{${name}}\`). Remove the self-reference or split it into two metrics.`
				);
				continue;
			}
			const withList = others.length === 1 ? others[0] : others.join(', ');
			flagMetric(
				name,
				`Metric "${name}" forms a cycle with ${withList}: ${trail}. Remove one of the {${others[0]}} references to break the loop.`
			);
		}
	}

	// Aggregate: per-metric errors flow through the errors list too, so downstream
	// (studio squiggle painter, publish/commit validator) see one flat list to walk.
	const allErrors = [...errors, ...[...badMetrics.values()].flat()];

	// View-level errors (missing/duplicate base, empty metrics) still kill the
	// view — no siblings to salvage. Metric-level errors don't,
	// UNLESS every metric is bad: a view with zero valid metrics can't answer
	// anything, so treat it the same as an empty `metrics:`. Count against the
	// RAW entries — a schema-failing metric never entered `metricEntries` but
	// still counts as "defined but bad" for this gate.
	const goodMetricCount = metricEntries.filter(([n]) => !badMetrics.has(n)).length;
	const allMetricsBad = rawMetricEntries.length > 0 && goodMetricCount === 0;
	if (errors.length > 0 || allMetricsBad) return { errors: allErrors };

	return {
		errors: allErrors,
		view: {
			base: data.base,
			baseSql: data.base_sql,
			date: data.date,
			defaultDateGrain: data.default_date_grain,
			dimensions: Object.entries(data.dimensions ?? {}).map(([name, source]) => ({ name, source })),
			// Drop metrics with any error so callers don't see (and try to compile)
			// a definition that failed validation. Sibling metrics still ship.
			metrics: metricEntries
				.filter(([name]) => !badMetrics.has(name))
				.map(([name, m]) => ({
					name,
					sql: m.sql as string,
					filter: m.filter,
					fmt: m.fmt,
					label: m.label,
					synonyms: m.synonyms,
					description: m.description,
					date: m.date
				}))
		}
	};
}
