import { normalizeCredentials, type PostgresCredentials } from '../postgres/credentials';

/**
 * Cube's SQL API is Postgres-wire, so the execution-layer credentials are exactly
 * the Postgres shape — host/port/user/password/database, a search_path schema, and
 * TLS material. Aliased rather than redeclared so the shared pg-wire engine (Studio
 * client, CLI executor) consumes Cube and Postgres credentials interchangeably.
 */
export type CubeCredentials = PostgresCredentials;

export const normalizeCubeCredentials = normalizeCredentials;
