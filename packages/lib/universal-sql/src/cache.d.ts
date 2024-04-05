import type { Table } from 'apache-arrow';

type CacheOptions = {
	/** Hash of the route being requested */
	route_hash: string;
	/** Some additional hash (usually parameters for the page) */
	additional_hash: string;
	/** Query name being requested or saved */
	query_name: string;
	/** Whether or not the page is currently being prerendered */
	prerendering: boolean;
};

export abstract class DuckDBCache {
	/**
	 * Saves data for a given SQL string
	 * @param sql_string SQL string corresponding to the data
	 * @param data Apache Arrow result of the query
	 * @param cache_options Additional options for caching
	 */
	abstract cacheQueryResult(
		sql_string: string,
		data: Table,
		cache_options: CacheOptions
	): Promise<void>;

	/**
	 * Gets data for a given query hash
	 * @param query_name Hash of the query being requested
	 */
	abstract getDataForQueryHash(query_hash: string): Promise<Buffer>;

	/**
	 * Get all query strings for a given page
	 * @param route_hash Hash of the route being requested
	 * @param additional_hash Some additional hash (usually parameters for the page)
	 */
	abstract getAllPageQueries(route_hash: string, additional_hash: string): Promise<void>;

	/**
	 * Persist the cache, as the returned promises aren't necessarily awaited
	 */
	abstract persist(): Promise<void>;
}
