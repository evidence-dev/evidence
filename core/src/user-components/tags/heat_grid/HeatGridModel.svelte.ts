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
import { buildHeatGridSQLConfig } from './build-heat-grid-sql';
import { resolveMetric } from '../../../metrics/resolve-metric';

type HeatGridAttributes = UserComponentProps<typeof schema>;

type SerializedHeatGrid = {
	query: SerializedQuery;
};

type HeatGridModelGenerics = WithDefaults<{
	Attributes: HeatGridAttributes;
	Serialized: SerializedHeatGrid;
}>;

export class HeatGridModel extends UserComponentModel<HeatGridModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<HeatGridModelGenerics>) {
		super(init, {
			validChildClasses: undefined
		});

		this.query = new Query(() => this.queryConfig, init.deps, {}, init.serialized?.query);
	}

	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedDimension = $derived(this.resolveColumn(this.attributes.dimension));
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	readonly resolvedMetric = $derived(this.resolveText(this.attributes.metric));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));
	readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	readonly resolvedUnits = $derived(this.resolveText(this.attributes.units));

	// `metric="revenue"` supplies base + aggregate SQL + format; dimension +
	// thresholds stay on the component.
	readonly metricCompiled = $derived(
		resolveMetric(this.metricsCatalog, this.resolvedMetric, this.deps.connection.dialect)
	);

	readonly resolvedFmt = $derived.by(() => {
		const explicit = this.resolveText(this.attributes.fmt);
		if (explicit) return explicit;
		return this.metricCompiled?.columnFormats[this.metricCompiled.name];
	});

	readonly dimensionProcessed: ProcessedColumnExpression = $derived.by(() =>
		processColumnExpression(
			{ value: this.resolvedDimension, type: 'dimension' },
			this.deps.connection.dialect
		)
	);

	readonly valueProcessed: ProcessedColumnExpression = $derived.by(() =>
		processColumnExpression(
			{ value: this.metricCompiled?.valueExpression ?? this.resolvedValue ?? '' },
			this.deps.connection.dialect
		)
	);

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) {
			return undefined;
		}

		const sqlProps = extractSQLProps(this.attributes);
		const metric = this.metricCompiled;
		const data = metric?.base ?? this.resolvedData;
		const value = metric?.valueExpression ?? this.resolvedValue;
		if (!data || !value) return undefined;

		return buildHeatGridSQLConfig({
			data,
			dimension: this.resolvedDimension,
			value,
			filters: this.attributes.filters || [],
			...sqlProps,
			where: this.resolvedWhere,
			dialect: this.deps.connection.dialect
		});
	});

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedHeatGrid {
		return {
			query: this.query.toSerialized()
		};
	}
}
