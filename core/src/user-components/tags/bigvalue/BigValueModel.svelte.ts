import { Query, type SerializedQuery } from '../../../Query.svelte';
import { type UserComponentProps } from '../../types';
import type { schema } from './schema';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../UserComponentModel';
import type { SQLQueryConfig } from '../../common/sql-options';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../common/sql-expression-utils';
import { buildComparisonQueryConfig } from '../../common/build-comparisons';
import { generateSparklineId } from '../../common/sql-options';
import { bigValueSql, resolveBigValueSqlInputs } from './sql';
import { stableQueries } from '../../component-sql';

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

	readonly sqlInputs = $derived(resolveBigValueSqlInputs(this.attributes, this.sqlEnv));
	readonly resolvedData = $derived(this.sqlInputs.data);
	readonly resolvedValue = $derived(this.sqlInputs.value);
	readonly resolvedMetric = $derived(this.sqlInputs.metric);
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

	readonly metricCompiled = $derived(this.sqlInputs.metricCompiled);

	// Explicit `fmt` wins; otherwise inherit the metric's declared format.
	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});
	readonly resolvedLink = $derived(this.resolveText(this.attributes.link));
	readonly resolvedWhere = $derived(this.sqlInputs.where);
	readonly resolvedDateRange = $derived(this.sqlInputs.dateRange);
	readonly resolvedComparison = $derived(this.sqlInputs.comparison);
	readonly resolvedSparkline = $derived(this.sqlInputs.sparkline);

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

	#keepStable = stableQueries<SQLQueryConfig>();
	readonly queries = $derived(
		this.#keepStable(
			this.hasBlockingError ? [] : bigValueSql.queries(this.attributes, this.sqlEnv, undefined)
		)
	);
	readonly queryConfig: SQLQueryConfig | undefined = $derived(
		this.queries.find((q) => q.role === 'data')?.config
	);

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
