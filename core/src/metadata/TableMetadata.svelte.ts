import type { IColumnMetadata, ITableMetadata } from '../metadata/metadata';

export type TableMetadataOpts = {
	/**
	 * Default case-sensitivity for `getColumn` lookups. Should be true for
	 * warehouses that case-fold unquoted identifiers (Snowflake). Defaults to
	 * false so ClickHouse behaviour is unchanged.
	 */
	caseInsensitive?: boolean;
};

export class TableMetadata {
	get name() {
		return this.#metadata.name;
	}

	get columns() {
		return Object.values(this.#metadata.columns);
	}

	get tableType() {
		return this.#metadata.tableType;
	}

	get error() {
		return this.#metadata.error;
	}

	// @ts-expect-error #metadata is initialized in the constructor
	#metadata: ITableMetadata = $state();
	readonly #caseInsensitive: boolean;

	constructor(metadata: ITableMetadata, opts?: TableMetadataOpts) {
		this.#metadata = metadata;
		this.#caseInsensitive = opts?.caseInsensitive ?? false;
	}

	getColumn(
		name: string,
		opts?: { caseInsensitive?: boolean }
	): IColumnMetadata | undefined {
		const columns = this.#metadata.columns;
		const exact = columns[name];
		if (exact) return exact;

		const caseInsensitive = opts?.caseInsensitive ?? this.#caseInsensitive;
		if (!caseInsensitive) return undefined;

		// Snowflake-style case-folding: an unquoted `total_sales` column reference
		// should match a returned `TOTAL_SALES` column. Fall through to a CI scan.
		const upper = name.toUpperCase();
		for (const key of Object.keys(columns)) {
			if (key.toUpperCase() === upper) return columns[key];
		}
		return undefined;
	}

	toJSON() {
		return this.#metadata;
	}
}
