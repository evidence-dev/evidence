import type { ClickHouseConnection } from './connection-schema';
import type { ClickHouseCredentials } from './credentials';

/**
 * Config layer → execution layer. Collapses host/port/secure into the HTTP(S)
 * interface URL the client connects to. `port`, `secure`, `username`,
 * `database`, and `databases` are always present post-parse (schema defaults),
 * so no fallbacks.
 */
export function resolveClickHouseCredentials(config: ClickHouseConnection): ClickHouseCredentials {
	const protocol = config.secure ? 'https' : 'http';
	return {
		url: `${protocol}://${config.host}:${config.port}`,
		username: config.username,
		password: config.password,
		accessToken: config.access_token,
		database: config.database,
		databases: config.databases
	};
}
