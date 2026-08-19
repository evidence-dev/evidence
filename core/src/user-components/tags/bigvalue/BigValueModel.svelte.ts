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
import { generateSparklineId } from '../../common/sql-options';
import { resolveComparisonFromSelector } from '../../common/parse-comparison-selector';
import { buildBigValueSQLConfig } from './build-bigvalue-sql';
import { resolveMetric } from '../../../metrics/resolve-metric';

type BigValueAttributes = UserComponentProps<typeof schema>;

type SerializedBigValue = {
	query: SerializedQuery;
};

type BigValueModelGenerics = WithDefaults<{
	Attributes: BigValueAttributes;
	Serialized: SerializedBigValue;
}>;

export class BigValueModel extends UserComponentModel<BigValueModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<BigValueModelGenerics>) {
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

	// Resolve props with variable support
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	readonly resolvedMetric = $derived(this.resolveText(this.attributes.metric));
	// Explicit `title` wins; in metric mode default to the metric's `label`, else
	// its prettified name — so `{% big_value metric="revenue" /%}` is labelled
	// without repeating the name. Raw mode keeps its existing displayAlias fallback
	// (applied in the component).
	readonly resolvedTitle = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.title);
		if (explicit) return explicit;
		if (this.metricCompiled) return this.metricCompiled.displayLabel;
		return explicit;
	});
	readonly resolvedInfo = $derived(this.resolveText(this.attributes.info));
	readonly resolvedInfo_link = $derived(this.resolveText(this.attributes.info_link));
	readonly resolvedInfo_link_title = $derived(this.resolveText(this.attributes.info_link_title));

	// `metric="revenue"` is the whole reference — a metric is a single number, so
	// no `value=`. Resolution (catalog lookup + compile) lives in the shared
	// `resolveMetric` helper so every `metric=`-capable component reuses it. A bad
	// reference is caught at edit time by the `metricExists` validator, exactly
	// like `tableExists` for `data=` — so there's no bespoke runtime error here.
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.connection.dialect)
	);

	// Explicit `fmt` wins; otherwise inherit the metric's declared format.
	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});
	readonly resolvedLink = $derived(this.resolveText(this.attributes.link));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

	readonly resolvedDateRange = $derived.by(() => {
		if (!this.attributes.date_range) return undefined;
		// Process entire date_range object - recursively handles all string properties
		return this.resolveText(this.attributes.date_range);
	});

	readonly resolvedComparison = $derived.by(() => {
		if (!this.attributes.comparison) {
			return undefined;
		}

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

	readonly resolvedSparkline = $derived.by(() => {
		if (!this.attributes.sparkline) return undefined;
		const sparkline = this.resolveText(this.attributes.sparkline);
		// Metric mode: default the sparkline's time axis to the view's date/grain
		// (still overrideable) — mirrors resolveMetricChart. Grain only applies when
		// x IS the view's date, never forced onto a non-temporal x.
		const metric = this.metricCompiled;
		if (!metric?.valueExpression) return sparkline;
		const x =
			sparkline.x ?? sparkline.date_range?.date ?? this.resolvedDateRange?.date ?? metric.viewDate;
		const date_grain =
			sparkline.date_grain ?? (x && x === metric.viewDate ? metric.viewGrain : undefined);
		return { ...sparkline, x, date_grain };
	});

	// Exposed for BigValue.svelte; buildBigValueSQLConfig recomputes internally.
	readonly comparisonId: string | null = $derived.by(() => {
		const config = buildComparisonQueryConfig(
			this.resolvedComparison,
			this.valueProcessed,
			this.resolvedDateRange
		);
		return config?.id ?? null;
	});

	readonly sparklineId: string | null = $derived.by(() => {
		const sparkline = this.resolvedSparkline;
		if (!sparkline) return null;
		const xColumn = sparkline.x ?? sparkline.date_range?.date ?? this.resolvedDateRange?.date;
		if (!xColumn) return null;
		return generateSparklineId(this.valueProcessed.alias);
	});

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) return undefined;

		const sqlProps = extractSQLProps(this.attributes);

		// Metric path: the metric supplies the base table + aggregate expression,
		// but everything else flows through the SAME builder as the raw path — so
		// component `filters`/`date_range`/`where`/`comparison`/`sparkline` all
		// apply, and the metric's declared filter/format/label are respected.
		const metric = this.metricCompiled;
		if (metric?.valueExpression) {
			return buildBigValueSQLConfig({
				data: metric.base,
				value: metric.valueExpression,
				where: this.resolvedWhere,
				having: sqlProps.having,
				qualify: sqlProps.qualify,
				order: sqlProps.order,
				date_range: this.resolvedDateRange,
				comparison: this.resolvedComparison,
				sparkline: this.resolvedSparkline,
				filters: this.attributes.filters,
				dialect: this.deps.connection.dialect
			});
		}
		// `metric=` set but unresolved → no query (edit-time validation flags it);
		// never fall through to the raw path.
		if (this.resolvedMetric) return undefined;

		// Raw data path needs both a data source and a value expression; validation
		// enforces this, but guard so the derivation never passes undefined through.
		const data = this.resolvedData;
		const value = this.resolvedValue;
		if (!data || !value) return undefined;

		return buildBigValueSQLConfig({
			data,
			value,
			where: this.resolvedWhere,
			having: sqlProps.having,
			qualify: sqlProps.qualify,
			order: sqlProps.order,
			date_range: this.resolvedDateRange,
			comparison: this.resolvedComparison,
			sparkline: this.resolvedSparkline,
			filters: this.attributes.filters,
			dialect: this.deps.connection.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedBigValue {
		return {
			query: this.query.toSerialized()
		};
	}

	readonly valueProcessed: ProcessedColumnExpression = $derived.by(() => {
		// Metric path: use the metric's aggregate expression so the processed alias
		// matches the column the query emits (both go through the same builder).
		return processColumnExpression(
			{ value: this.metricCompiled?.valueExpression ?? this.resolvedValue ?? '' },
			this.deps.connection.dialect
		);
	});
}
