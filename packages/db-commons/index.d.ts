export * from './index.cjs';

export type RunQuery<T extends Record<string, unknown>> = (
	queryString: string,
	database: T,
	batchSize: number
) => Promise<QueryResult>;

export type EvidenceColumnType = number | boolean | string | Date;

export type GetRunner<T extends Record<string, unknown>> = (
	opts: T,
	directory: string
) => (queryContent: string, queryPath: string, batchSize: number) => Promise<QueryResult>;

export type ConnectionTester<T extends Record<string, unknown>> = (
	opts: T,
	directory: string
) => Promise<boolean>;

type FileContent = () => Promise<string>;
export interface SourceDirectory {
	[filename: string]: SourceDirectory | FileContent;
}

export type ProcessSource<T extends Record<string, unknown>> = (
	opts: T,
	files: SourceDirectory,
	utils: {
		isCached: (name: string, content: string) => boolean;
		isFiltered: (name: string) => boolean;
		shouldRun: (name: string, content: string) => boolean;
		addToCache: (name: string, content: string) => void;
	}
) => AsyncIterable<QueryResult & { name: string; content: string }>;
