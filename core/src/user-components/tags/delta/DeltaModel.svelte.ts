import { Query, type SerializedQuery } from '../../../Query.svelte';
import { type UserComponentProps } from '../../types';
import type { schema } from './schema';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../UserComponentModel';
import type { SQLQueryConfig } from '../../common/sql-options';
import { extractSQLProps } from '../../common/sql-options';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../common/sql-expression-utils';
import { buildComparisonQueryConfig } from '../../common/build-comparisons';
import { resolveComparisonFromSelector } from '../../common/parse-comparison-selector';
import { buildDeltaSQLConfig } from './build-delta-sql';
import { resolveMetric } from '../../../metrics/resolve-metric';

type DeltaAttributes = UserComponentProps<typeof schema>;

type SerializedDelta = {
	query: SerializedQuery;
};

type DeltaModelGenerics = WithDefaults<{
	Attributes: DeltaAttributes;
	Serialized: SerializedDelta;
}>;

export class DeltaModel extends UserComponentModel<DeltaModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<DeltaModelGenerics>) {
		super(init, {
			validChildClasses: undefined
		});

		this.query = new Query(
			() => this.queryConfig,
			init.deps,
			{ refreshInterval: () => this.attributes.refresh_interval },
			init.serialized?.query
		);
	}

	// Resolve attributes with variable interpolation
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	readonly resolvedMetric = $derived(this.resolveText(this.attributes.metric));
	readonly resolvedText = $derived(this.resolveText(this.attributes.text));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

	// `metric="revenue"` supplies base + aggregate SQL + format; everything else
	// (comparison/where/date_range/filters) flows through the same builder.
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.queryService.dialect)
	);

	// Explicit `fmt` wins; otherwise inherit the metric's declared format.
	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});

	readonly resolvedDateRange = $derived.by(() => {
		if (!this.attributes.date_range) return undefined;
		// Process entire date_range object - recursively handles all string properties
		return this.resolveText(this.attributes.date_range);
	});

	readonly resolvedComparison = $derived.by(() => {
		if (!this.attributes.comparison) return undefined;

		// Process variables in compare_vs (might be a selector reference like "{{comp}}")
		const processedCompareVs = this.processVariables(this.attributes.comparison.compare_vs, 'text');

		// Build comparison with resolved compare_vs, keeping original types
		const processedComparison = {
			...this.attributes.comparison,
			compare_vs: processedCompareVs
		};

		// Then resolve selector config if compare_vs contains a JSON config
		return resolveComparisonFromSelector(processedComparison);
	});

	readonly comparisonConfig = $derived.by(() => {
		return buildComparisonQueryConfig(
			this.resolvedComparison,
			this.valueProcessed,
			this.resolvedDateRange
		);
	});

	readonly comparisonId: string | null = $derived(this.comparisonConfig?.id ?? null);

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) {
			return undefined;
		}

		const sqlProps = extractSQLProps(this.attributes);

		// Metric path: metric supplies base + aggregate expression; everything else
		// flows through the same builder as the raw path.
		const metric = this.metricCompiled;
		if (metric?.valueExpression) {
			return buildDeltaSQLConfig({
				data: metric.base,
				value: metric.valueExpression,
				filters: this.attributes.filters || [],
				date_range: this.resolvedDateRange,
				comparison: this.resolvedComparison,
				...sqlProps,
				where: this.resolvedWhere,
				limit: this.attributes.limit ?? 1,
				dialect: this.deps.queryService.dialect
			});
		}
		// `metric=` set but unresolved → no query (edit-time validation surfaces it).
		if (this.resolvedMetric) return undefined;

		// Raw path needs both a data source and a value expression; validation
		// enforces this, but guard so the derivation never passes undefined through.
		const data = this.resolvedData;
		const value = this.resolvedValue;
		if (!data || !value) return undefined;

		return buildDeltaSQLConfig({
			data,
			value,
			filters: this.attributes.filters || [],
			date_range: this.resolvedDateRange,
			comparison: this.resolvedComparison,
			...sqlProps,
			where: this.resolvedWhere,
			limit: this.attributes.limit ?? 1,
			dialect: this.deps.queryService.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedDelta {
		return {
			query: this.query.toSerialized()
		};
	}

	readonly valueProcessed: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression(
			{
				value: this.metricCompiled?.valueExpression ?? this.resolvedValue ?? ''
			},
			this.deps.queryService.dialect
		);
	});
}
