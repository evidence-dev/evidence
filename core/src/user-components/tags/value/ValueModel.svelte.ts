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
import { buildValueSQLConfig } from './build-value-sql';
import { resolveMetric } from '../../../metrics/resolve-metric';

type ValueAttributes = UserComponentProps<typeof schema>;

type SerializedValue = {
	query: SerializedQuery;
};

type ValueModelGenerics = WithDefaults<{
	Attributes: ValueAttributes;
	Serialized: SerializedValue;
}>;

export class ValueModel extends UserComponentModel<ValueModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<ValueModelGenerics>) {
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

	// `metric="revenue"` supplies base + aggregate SQL + format; everything else
	// (comparison/where/date_range/filters) flows through the same builder.
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.queryService.dialect)
	);

	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});
	readonly resolvedColor = $derived(this.resolveText(this.attributes.color));
	readonly resolvedInfo = $derived(this.resolveText(this.attributes.info));
	readonly resolvedInfo_link = $derived(this.resolveText(this.attributes.info_link));
	readonly resolvedInfo_link_title = $derived(this.resolveText(this.attributes.info_link_title));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

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

	// Exposed for Value.svelte + Delta; buildValueSQLConfig recomputes internally.
	readonly comparisonId: string | null = $derived.by(() => {
		const config = buildComparisonQueryConfig(
			this.resolvedComparison,
			this.valueProcessed,
			this.resolvedDateRange
		);
		return config?.id ?? null;
	});

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) return undefined;

		const sqlProps = extractSQLProps(this.attributes);

		// Metric path: metric supplies base + aggregate expression; everything else
		// flows through the same builder as the raw path.
		const metric = this.metricCompiled;
		if (metric?.valueExpression) {
			return buildValueSQLConfig({
				data: metric.base,
				value: metric.valueExpression,
				where: this.resolvedWhere,
				having: sqlProps.having,
				qualify: sqlProps.qualify,
				order: sqlProps.order,
				date_range: this.resolvedDateRange,
				comparison: this.resolvedComparison,
				filters: this.attributes.filters,
				limit: this.attributes.limit,
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

		return buildValueSQLConfig({
			data,
			value,
			where: this.resolvedWhere,
			having: sqlProps.having,
			qualify: sqlProps.qualify,
			order: sqlProps.order,
			date_range: this.resolvedDateRange,
			comparison: this.resolvedComparison,
			filters: this.attributes.filters,
			limit: this.attributes.limit,
			dialect: this.deps.queryService.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedValue {
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
