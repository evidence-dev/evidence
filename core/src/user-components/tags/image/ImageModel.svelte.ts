import { Query, type SerializedQuery } from '../../../Query.svelte';
import type { AnyRowType } from '../../interfaces/query-service';
import { type UserComponentProps } from '../../types';
import type { schema } from './schema';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../UserComponentModel';
import type { SQLQueryConfig } from '../../common/sql-options';
import { extractSQLProps } from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import { buildImageSQLConfig } from './build-image-sql';

type ImageAttributes = UserComponentProps<typeof schema>;

type SerializedImage = {
	query: SerializedQuery;
};

type ImageModelGenerics = WithDefaults<{
	Attributes: ImageAttributes;
	Serialized: SerializedImage;
}>;

export class ImageModel extends UserComponentModel<ImageModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<ImageModelGenerics>) {
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

	readonly isDataDriven = $derived(Boolean(this.attributes.data));

	// Resolve attributes with variable interpolation
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedColumn = $derived(this.resolveColumn(this.attributes.column));
	readonly resolvedDarkColumn = $derived(this.resolveColumn(this.attributes.dark_column));
	readonly resolvedDescriptionColumn = $derived(
		this.resolveColumn(this.attributes.description_column)
	);
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));
	readonly resolvedUrl = $derived(this.resolveText(this.attributes.url));
	readonly resolvedDarkUrl = $derived(this.resolveText(this.attributes.dark_url));
	readonly resolvedDescription = $derived(this.resolveText(this.attributes.description));

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (!this.isDataDriven || this.hasBlockingError) return undefined;
		if (!this.resolvedData || !this.resolvedColumn) return undefined;

		const sqlProps = extractSQLProps(this.attributes);

		return buildImageSQLConfig({
			data: this.resolvedData,
			column: this.resolvedColumn,
			dark_column: this.resolvedDarkColumn,
			description_column: this.resolvedDescriptionColumn,
			where: this.resolvedWhere,
			qualify: sqlProps.qualify,
			order: sqlProps.order,
			filters: this.attributes.filters,
			limit: this.attributes.limit,
			dialect: this.deps.queryService.dialect
		});
	});

	private readonly firstRow: AnyRowType | undefined = $derived.by(
		() => this.query.result?.rows?.[0]
	);

	private columnValue(column: string | undefined): string | undefined {
		const row = this.firstRow;
		if (!column || !row) return undefined;
		const { alias } = processColumnExpression({ value: column }, this.deps.queryService.dialect);
		const value = row[alias];
		return value === null || value === undefined || value === '' ? undefined : String(value);
	}

	// Mode-aware display values: query row in data mode, static attributes otherwise
	readonly imageUrl = $derived.by(() =>
		this.isDataDriven ? this.columnValue(this.resolvedColumn) : this.resolvedUrl
	);

	readonly darkImageUrl = $derived.by(() =>
		this.isDataDriven ? this.columnValue(this.resolvedDarkColumn) : this.resolvedDarkUrl
	);

	readonly imageDescription = $derived.by(() =>
		this.isDataDriven
			? this.columnValue(this.resolvedDescriptionColumn) ?? this.resolvedDescription
			: this.resolvedDescription
	);

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedImage {
		return {
			query: this.query.toSerialized()
		};
	}
}
