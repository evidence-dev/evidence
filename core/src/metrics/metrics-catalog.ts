import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { getContext, setContext } from 'svelte';
import { parseMetricsView, type Metric, type MetricsView } from './metric-schema';

/** A metric plus the view it belongs to (base/date/dimensions/joins live on the view). */
export type CatalogMetric = { metric: Metric; view: MetricsView };

/**
 * Reactive registry of the project's metrics, keyed by each metric's flat,
 * globally-unique name (across all metrics views). Parallels `InlineQueries`:
 * populated from the raw yaml of the `metrics/*.yaml` views (server ships the
 * content, the client parses with the same pure parser used for validation),
 * and read by component Models to compile a `metric=` reference. Files that fail
 * to parse are skipped; first definition wins on a duplicate metric name.
 */
export class MetricsCatalog {
	readonly #metrics = new SvelteMap<string, CatalogMetric>();
	// Metric names defined in more than one view/file. Metric names are a flat,
	// project-wide namespace, so a collision is an authoring error — surfaced as an
	// editor squiggle and blocked at the commit gate. First definition still wins
	// at runtime so a conflict degrades rather than breaks.
	readonly #conflicts = new SvelteSet<string>();

	constructor(files?: Record<string, string>) {
		if (files) this.setFromYaml(files);
	}

	getMetric(name: string): CatalogMetric | undefined {
		return this.#metrics.get(name.trim());
	}

	hasMetric(name: string): boolean {
		return this.#metrics.has(name.trim());
	}

	listMetrics(): CatalogMetric[] {
		return [...this.#metrics.values()];
	}

	/** Metric names that appear in more than one metrics file (must be unique). */
	getConflictingNames(): ReadonlySet<string> {
		return this.#conflicts;
	}

	/** Number of metrics (not views). */
	get size(): number {
		return this.#metrics.size;
	}

	/**
	 * Replace the catalog from raw yaml content (keyed by file path; the path is
	 * ignored — metrics are keyed by their flat name). Diffs against the current
	 * map so unchanged metrics don't fire spurious reactive invalidations.
	 */
	setFromYaml(files: Record<string, string>): void {
		const next = new Map<string, CatalogMetric>();
		const counts = new Map<string, number>();
		for (const content of Object.values(files)) {
			const { view } = parseMetricsView(content);
			if (!view) continue;
			for (const metric of view.metrics) {
				counts.set(metric.name, (counts.get(metric.name) ?? 0) + 1);
				if (!next.has(metric.name)) next.set(metric.name, { metric, view });
			}
		}
		for (const key of [...this.#metrics.keys()]) {
			if (!next.has(key)) this.#metrics.delete(key);
		}
		for (const [key, entry] of next) {
			const existing = this.#metrics.get(key);
			if (!existing || JSON.stringify(existing) !== JSON.stringify(entry)) {
				this.#metrics.set(key, entry);
			}
		}
		const conflicts = new Set([...counts].filter(([, n]) => n > 1).map(([name]) => name));
		for (const name of [...this.#conflicts]) if (!conflicts.has(name)) this.#conflicts.delete(name);
		for (const name of conflicts) this.#conflicts.add(name);
	}
}

const METRICS_CATALOG_CONTEXT_KEY = Symbol('METRICS_CATALOG_CONTEXT');

export const createMetricsCatalogContext = (files?: Record<string, string>): MetricsCatalog => {
	const context = new MetricsCatalog(files);
	setContext(METRICS_CATALOG_CONTEXT_KEY, context);
	return context;
};

export const getMetricsCatalogContext = (): MetricsCatalog | undefined => {
	return getContext<MetricsCatalog | undefined>(METRICS_CATALOG_CONTEXT_KEY);
};
