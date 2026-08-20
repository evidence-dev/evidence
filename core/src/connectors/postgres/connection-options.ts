import type { PostgresCredentials } from './credentials';

/**
 * node-postgres `ssl` option shape (a subset of Node's tls.ConnectionOptions).
 * Kept as a plain structural type so core needs no `pg`/`tls` dependency; both
 * the CLI executor and the Studio server client feed it straight into `new
 * pg.Client({ ssl })`.
 */
export type PostgresSslOption =
	| false
	| {
			ca?: string;
			cert?: string;
			key?: string;
			rejectUnauthorized: boolean;
			checkServerIdentity?: () => undefined;
	  };

/**
 * Translate our `sslmode` + PEM material into node-postgres's `ssl` option.
 *
 *  - `disable`     → no TLS.
 *  - `require`     → encrypt, but don't verify the server cert (rejectUnauthorized: false).
 *  - `verify-ca`   → verify the cert chain against the CA but skip the hostname
 *                    check (checkServerIdentity no-op), matching libpq semantics.
 *  - `verify-full` → verify chain *and* hostname (tls default).
 *
 * `ca`/`cert`/`key` are passed through when present so a private CA (RDS bundle)
 * or mutual-TLS client cert is honoured.
 */
export function buildPostgresSsl(ssl: PostgresCredentials['ssl']): PostgresSslOption {
	if (ssl.mode === 'disable') return false;

	const material = {
		...(ssl.ca ? { ca: ssl.ca } : {}),
		...(ssl.cert ? { cert: ssl.cert } : {}),
		...(ssl.key ? { key: ssl.key } : {})
	};

	if (ssl.mode === 'require') {
		return { ...material, rejectUnauthorized: false };
	}
	if (ssl.mode === 'verify-ca') {
		return { ...material, rejectUnauthorized: true, checkServerIdentity: () => undefined };
	}
	// verify-full
	return { ...material, rejectUnauthorized: true };
}
