import { normalizeCredentials, type PostgresCredentials } from '../postgres/credentials';

/**
 * Redshift is Postgres-wire, so the execution-layer credentials are exactly the
 * Postgres shape — host/port/user/password/database, a search_path schema, and
 * TLS material. Aliased rather than redeclared so the shared pg-wire engine
 * (Studio client, CLI executor) consumes Redshift and Postgres credentials
 * interchangeably, as it already does for Cube.
 */
export type RedshiftCredentials = PostgresCredentials;

export const normalizeRedshiftCredentials = normalizeCredentials;
