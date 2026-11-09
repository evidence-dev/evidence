import type { AthenaCredentials } from './credentials';
import type { AthenaColumnInfo } from './map-columns';
import type { AthenaRow } from './normalize-rows';

// Structural subsets of the SDK's command inputs/outputs, so core needs no @aws-sdk dependency.
export type AthenaStartInput = {
	QueryString: string;
	WorkGroup: string;
	QueryExecutionContext: { Catalog: string; Database: string };
	ResultConfiguration?: { OutputLocation: string };
	ResultReuseConfiguration?: {
		ResultReuseByAgeConfiguration: { Enabled: boolean; MaxAgeInMinutes: number };
	};
};

export type AthenaQueryExecution = {
	StatementType?: string;
	Status?: {
		State?: string;
		StateChangeReason?: string;
		AthenaError?: { ErrorMessage?: string };
	};
};

/** Each caller wraps its own SDK client (and abort signal) behind these four calls. */
export type AthenaQueryApi<E extends AthenaQueryExecution = AthenaQueryExecution> = {
	start(input: AthenaStartInput): Promise<{ QueryExecutionId?: string }>;
	getExecution(id: string): Promise<{ QueryExecution?: E }>;
	getResults(
		id: string,
		nextToken: string | undefined
	): Promise<{
		ResultSet?: { Rows?: AthenaRow[]; ResultSetMetadata?: { ColumnInfo?: AthenaColumnInfo[] } };
		NextToken?: string;
	}>;
	stop(id: string): Promise<unknown>;
};

export type AthenaRunResult<E extends AthenaQueryExecution = AthenaQueryExecution> = {
	columnInfo: AthenaColumnInfo[];
	rows: AthenaRow[];
	execution: E;
};

const POLL_INITIAL_MS = 100;
const POLL_MAX_MS = 1_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				resolve();
			},
			{ once: true }
		);
	});
}

export function athenaStartInput(
	creds: AthenaCredentials,
	sql: string,
	workGroup?: string
): AthenaStartInput {
	return {
		QueryString: sql,
		WorkGroup: workGroup ?? creds.workGroup,
		QueryExecutionContext: { Catalog: creds.catalog, Database: creds.schema },
		...(creds.outputLocation
			? { ResultConfiguration: { OutputLocation: creds.outputLocation } }
			: {}),
		...(creds.resultReuseMinutes > 0
			? {
					ResultReuseConfiguration: {
						ResultReuseByAgeConfiguration: {
							Enabled: true,
							MaxAgeInMinutes: creds.resultReuseMinutes
						}
					}
				}
			: {})
	};
}

/** Start a query, poll it to completion, and page through every result row. */
export async function runAthenaQuery<E extends AthenaQueryExecution>(
	api: AthenaQueryApi<E>,
	input: AthenaStartInput,
	opts: { timeoutMs: number; signal?: AbortSignal; onStopError?: (err: unknown) => void }
): Promise<AthenaRunResult<E>> {
	const deadline = Date.now() + opts.timeoutMs;
	const { QueryExecutionId: id } = await api.start(input);
	if (!id) throw new Error('Athena did not return a query execution ID');

	let execution: E | undefined;
	let delay = POLL_INITIAL_MS;
	try {
		for (;;) {
			execution = (await api.getExecution(id)).QueryExecution;
			const state = execution?.Status?.State;
			if (state === 'SUCCEEDED') break;
			if (state === 'FAILED' || state === 'CANCELLED') {
				throw new Error(
					execution?.Status?.StateChangeReason ??
						execution?.Status?.AthenaError?.ErrorMessage ??
						`Athena query ${state.toLowerCase()}`
				);
			}
			if (opts.signal?.aborted) throw new Error('Athena query was aborted');
			if (Date.now() > deadline) {
				throw new Error(`Athena query timed out after ${Math.round(opts.timeoutMs / 1000)}s`);
			}
			await sleep(delay, opts.signal);
			delay = Math.min(delay * 1.5, POLL_MAX_MS);
		}
	} catch (err) {
		const state = execution?.Status?.State;
		if (state !== 'FAILED' && state !== 'CANCELLED' && state !== 'SUCCEEDED') {
			// Don't leave an abandoned query scanning (and billing) in the customer's account.
			await api.stop(id).catch((stopErr) => opts.onStopError?.(stopErr));
		}
		throw err;
	}

	let columnInfo: AthenaColumnInfo[] = [];
	const rows: AthenaRow[] = [];
	let nextToken: string | undefined;
	let first = true;
	do {
		const page = await api.getResults(id, nextToken);
		const pageRows = page.ResultSet?.Rows ?? [];
		if (first) {
			columnInfo = page.ResultSet?.ResultSetMetadata?.ColumnInfo ?? [];
			// SELECT results repeat the column labels as the first row.
			rows.push(...(execution?.StatementType === 'DML' ? pageRows.slice(1) : pageRows));
			first = false;
		} else {
			rows.push(...pageRows);
		}
		nextToken = page.NextToken;
	} while (nextToken);

	return { columnInfo, rows, execution: execution! };
}
