import { type UserComponentProps } from '../../types';
import type { schema } from './schema';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../UserComponentModel';
import type { SQLQueryConfig } from '../../common/sql-options';
import { extractSQLProps, generateSQLQuery } from '../../common/sql-options';
import type { QueryResult } from '../../interfaces/query-service';

type DownloadAttributes = UserComponentProps<typeof schema>;

type SerializedDownload = Record<string, never>; // No serialization needed

type DownloadModelGenerics = WithDefaults<{
	Attributes: DownloadAttributes;
	Serialized: SerializedDownload;
}>;

export class DownloadModel extends UserComponentModel<DownloadModelGenerics> {
	constructor(init: UserComponentModelInit<DownloadModelGenerics>) {
		super(init, {
			validChildClasses: undefined
		});
	}

	// Resolve attributes with variable interpolation
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedLabel = $derived(this.resolveText(this.attributes.label) ?? 'Download');
	readonly resolvedFilename = $derived(
		this.resolveText(this.attributes.filename) ??
			this.resolvedData?.replace(/[^a-zA-Z0-9_-]/g, '_') ??
			'data'
	);
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) {
			return undefined;
		}

		const sqlProps = extractSQLProps(this.attributes);

		return {
			tableExpressionName: this.resolvedData,
			columns: [], // Empty columns array means select all
			filterIds: this.attributes.filters || [],
			...sqlProps,
			where: this.resolvedWhere, // Override where with resolved version
			// Default to 2000 rows, but allow users to specify up to MAX_DOWNLOAD_LIMIT
			limit: this.attributes.limit ?? 2000
		};
	});

	async init(): Promise<void> {
		// No automatic query execution - data is fetched on button click
	}

	toSerialized(): SerializedDownload {
		return {}; // No serialization needed
	}

	/**
	 * Fetch data when user clicks download button
	 */
	async fetchData(): Promise<QueryResult> {
		if (this.hasBlockingError || !this.queryConfig) {
			throw new Error('Cannot fetch data: component has validation errors');
		}

		const { sql } = generateSQLQuery(
			this.queryConfig,
			this.deps.filterContexts,
			this.deps.inlineQueries,
			undefined,
			this.projectSettings.first_day_of_week,
			this.deps.connection.dialect
		);

		// Execute query directly without caching
		return await this.deps.connection.query(sql, { noCache: true });
	}
}
