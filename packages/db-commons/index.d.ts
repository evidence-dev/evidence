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
