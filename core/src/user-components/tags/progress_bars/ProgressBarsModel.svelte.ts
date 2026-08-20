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
import { buildProgressBarsSQLConfig } from './build-progress-bars-sql';
import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';

type ProgressBarsAttributes = UserComponentProps<typeof schema>;

type SerializedProgressBars = {
	query: SerializedQuery;
};

type ProgressBarsModelGenerics = WithDefaults<{
	Attributes: ProgressBarsAttributes;
	Serialized: SerializedProgressBars;
}>;

export class ProgressBarsModel extends UserComponentModel<ProgressBarsModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<ProgressBarsModelGenerics>) {
		super(init, {
			validChildClasses: undefined
		});

		this.query = new Query(() => this.queryConfig, init.deps, {}, init.serialized?.query);
	}

	// `metric="providers"` resolves the aggregate SQL + base + format from the
	// catalog. progress_bars needs TWO aggregates (numerator/denominator), so
	// the metric supplies the DENOMINATOR (the governed "total") and the
	// author still writes the numerator's specialization on top. Same shared
	// helper as big_value/charts.
	readonly resolvedMetric = $derived(this.resolveText(this.attributes.metric));
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.connection.dialect)
	);

	readonly resolvedData = $derived(
		this.resolveText(this.attributes.data) ?? this.metricCompiled?.base
	);
	// Named-dimension resolution in metric mode (`dimension="product"` →
	// `product_line` when the view declares it). Raw columns pass through.
	readonly resolvedDimension = $derived(
		applyMetricDimension(this.metricCompiled, this.resolveColumn(this.attributes.dimension))
	);
	readonly resolvedNumerator = $derived(this.resolveColumn(this.attributes.numerator));
	// In metric mode the denominator defaults to the metric's aggregate SQL —
	// author can still override with an explicit `denominator=`.
	readonly resolvedDenominator = $derived(
		this.resolveColumn(this.attributes.denominator) ?? this.metricCompiled?.valueExpression
	);
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));
	readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	readonly resolvedFmt = $derived(
		this.resolveText(this.attributes.fmt) ??
			(this.metricCompiled
				? this.metricCompiled.columnFormats[this.metricCompiled.name]
				: undefined)
	);

	readonly dimensionProcessed: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression(
			{
				value: this.resolvedDimension,
				type: 'dimension'
			},
			this.deps.connection.dialect
		);
	});

	readonly numeratorProcessed: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression(
			{
				value: this.resolvedNumerator
			},
			this.deps.connection.dialect
		);
	});

	readonly denominatorProcessed: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression(
			{
				// In raw mode always set; in metric mode falls back to the metric's
				// aggregate. Empty string is safe — processColumnExpression returns
				// safe empties for an unresolved input and the queryConfig guards
				// above prevent a query from firing.
				value: this.resolvedDenominator ?? ''
			},
			this.deps.connection.dialect
		);
	});

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) {
			return undefined;
		}
		// Guard the metric-mode fallback surface: if data / denominator / dimension
		// / numerator can't be resolved (bad metric ref, missing attr) don't emit
		// a query with undefined slots — `metricExists` / dataSources have already
		// surfaced the underlying error to the author.
		if (
			!this.resolvedData ||
			!this.resolvedDimension ||
			!this.resolvedNumerator ||
			!this.resolvedDenominator
		) {
			return undefined;
		}

		const sqlProps = extractSQLProps(this.attributes);

		return buildProgressBarsSQLConfig({
			data: this.resolvedData,
			dimension: this.resolvedDimension,
			numerator: this.resolvedNumerator,
			denominator: this.resolvedDenominator,
			filters: this.attributes.filters || [],
			...sqlProps,
			where: this.resolvedWhere,
			dialect: this.deps.connection.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedProgressBars {
		return {
			query: this.query.toSerialized()
		};
	}
}
