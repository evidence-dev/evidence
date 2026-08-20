import type { MotherDuckConnection } from './connection-schema';
import type { MotherduckCredentials } from './credentials';

export type ResolveOpts = {
	/** Base directory for resolving file refs. MotherDuck has none, kept for parity. */
	cwd: string;
};

/**
 * Config layer → execution layer. MotherDuck's only secret is the inline service
 * token, so there's no file material to read (unlike Postgres TLS / Snowflake
 * private-key paths) — this is a straight projection. `host` and `schemas`
 * default post-parse, so no fallbacks are needed.
 */
export async function resolveMotherduckCredentials(
	config: MotherDuckConnection,
	_opts: ResolveOpts
): Promise<MotherduckCredentials> {
	return {
		token: config.token,
		database: config.database,
		host: config.host,
		schemas: config.schemas
	};
}
