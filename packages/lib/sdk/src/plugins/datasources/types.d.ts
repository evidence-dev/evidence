type FileContent = () => Promise<string>;

type QueryResultMeta = {
	columnTypes: {
		name: string;
		evidenceType: 'string' | 'number' | 'boolean' | 'date';
		typeFidelity: 'precise' | 'inferred';
	}[];
	expectedRowCount?: number | undefined;
};
type QueryResultData<T extends Record<string, unknown>[] = Record<string, unknown>[]> = {
	rows?: T;
} & QueryResultMeta;

type QueryResultUrl = {
	url: string;
} & QueryResultMeta;

export type QueryResult<T extends Record<string, unknown[]>> = QueryResultData<T> | QueryResultUrl;

export type QueryResultTable<T extends Record<string, unknown>[] = Record<string, unknown>[]> =
	QueryResult<T> & { name: string; content: string };

export interface SourceDirectory {
	[filename: string]: SourceDirectory | FileContent;
}

export type ProcessSourceFn<T extends Record<string, unknown> = Record<string, unknown>> = (
	opts: T,
	files: SourceDirectory,
	utils: {
		isCached: (name: string, content: string) => boolean;
		isFiltered: (name: string) => boolean;
		shouldRun: (name: string, content: string) => boolean;
		addToCache: (name: string, content: string) => void;
	}
) => AsyncIterable<QueryResultTable>;

export type Manifest = {
	/**
	 * Map of schema names to file URLs
	 */
	renderedFiles: Record<string, string[]>;
};

export type SourceFilters = {
	sources: Set<string> | null;
	queries: Set<string> | null;
	only_changed: boolean;
};
