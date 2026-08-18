/**
 * Execution-layer ClickHouse credentials, resolved from connection.yaml /
 * org-settings. The schema enforces exactly one of password / accessToken.
 */
export type ClickHouseCredentials = {
	/** HTTP(S) interface endpoint, e.g. https://host:8443. */
	url: string;
	username: string;
	password?: string;
	/** JWT (ClickHouse Cloud only); mutually exclusive with password. */
	accessToken?: string;
	database: string;
	/** Allowlist of databases exposed to metadata; empty = just `database`. */
	databases: string[];
};
