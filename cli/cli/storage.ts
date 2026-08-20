/**
 * Credential storage for EVD CLI
 * Stores auth tokens in ~/.evd/credentials.json
 */

import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import type { APTIntrospectResponse } from '@evidence/core/types/apt';

const EVD_DIR = join(homedir(), '.evd');
const CREDENTIALS_FILE = join(EVD_DIR, 'credentials.json');
const SESSION_CACHE_FILE = join(EVD_DIR, 'session-cache.json');

/** Maximum age (ms) for a cached session before it's considered stale */
const SESSION_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredCredentials {
	accessToken: string;
	refreshToken: string;
	/** Sealed session cookie for query engine auth */
	sealedSession?: string;
	/** Auth Proxy Token (APT) for CLI auth */
	aptToken?: string;
	/** Full APT introspect response */
	aptIntrospect?: APTIntrospectResponse;
	user: {
		id: string;
		email: string;
		firstName: string | null;
		lastName: string | null;
		profilePictureUrl: string | null;
	};
	organizationId: string | null;
	/** True when credentials were loaded from EVIDENCE_AUTH_TOKEN env var */
	fromEnv?: boolean;
}

interface SessionCache {
	sealedSession: string;
	refreshToken: string;
	organizationId: string;
	timestamp: number;
}

async function ensureDir(): Promise<void> {
	try {
		await mkdir(EVD_DIR, { recursive: true, mode: 0o700 });
	} catch (e) {
		// Directory might already exist
	}
}

export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
	await ensureDir();
	await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
		encoding: 'utf-8',
		mode: 0o600 // Only user can read/write
	});
}

/**
 * Save a session cache for env-var credentials.
 * Persists the sealed session and rotated refresh token to disk
 * so subsequent CLI invocations can reuse them.
 */
export async function saveSessionCache(
	sealedSession: string,
	refreshToken: string,
	organizationId: string
): Promise<void> {
	await ensureDir();
	const cache: SessionCache = {
		sealedSession,
		refreshToken,
		organizationId,
		timestamp: Date.now()
	};
	await writeFile(SESSION_CACHE_FILE, JSON.stringify(cache, null, 2), {
		encoding: 'utf-8',
		mode: 0o600
	});
}

/**
 * Load a cached session for the given organization.
 * Returns null if no cache exists, org doesn't match, or cache is stale.
 */
async function loadSessionCache(organizationId: string): Promise<SessionCache | null> {
	try {
		const data = await readFile(SESSION_CACHE_FILE, 'utf-8');
		const cache = JSON.parse(data);
		// Validate required fields to avoid poisoning credentials with a corrupt file
		if (
			typeof cache?.sealedSession !== 'string' ||
			typeof cache?.refreshToken !== 'string' ||
			typeof cache?.organizationId !== 'string' ||
			typeof cache?.timestamp !== 'number'
		) {
			return null;
		}
		if (cache.organizationId !== organizationId) return null;
		if (Date.now() - cache.timestamp > SESSION_CACHE_MAX_AGE_MS) return null;
		return cache as SessionCache;
	} catch {
		return null;
	}
}

/** Clear the session cache file (e.g. after a 401 from the query engine) */
export async function clearSessionCache(): Promise<void> {
	try {
		await unlink(SESSION_CACHE_FILE);
	} catch {
		// File may not exist
	}
}

export function loadCredentialsFromEnv(): StoredCredentials | null {
	const token = process.env.EVIDENCE_AUTH_TOKEN;
	if (!token) return null;

	try {
		const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

		if (!decoded.organizationId) {
			console.error(
				'  Warning: EVIDENCE_AUTH_TOKEN is missing required field (organizationId).'
			);
			return null;
		}

		// New APT-based format: { aptToken, organizationId } (with optional refreshToken for Phase 1)
		if (decoded.aptToken) {
			return {
				accessToken: '',
				refreshToken: decoded.refreshToken || '',
				aptToken: decoded.aptToken,
				organizationId: decoded.organizationId,
				user: {
					id: '',
					email: '',
					firstName: null,
					lastName: null,
					profilePictureUrl: null
				},
				fromEnv: true
			};
		}

		// Legacy format: { refreshToken, organizationId, sealedSession? }
		if (!decoded.refreshToken) {
			console.error(
				'  Warning: EVIDENCE_AUTH_TOKEN is missing required fields (refreshToken or aptToken).'
			);
			return null;
		}

		return {
			accessToken: '',
			refreshToken: decoded.refreshToken,
			sealedSession: decoded.sealedSession || undefined,
			organizationId: decoded.organizationId,
			user: {
				id: '',
				email: '',
				firstName: null,
				lastName: null,
				profilePictureUrl: null
			},
			fromEnv: true
		};
	} catch {
		console.error('  Warning: EVIDENCE_AUTH_TOKEN is malformed (expected base64-encoded JSON).');
		return null;
	}
}

export async function loadCredentials(): Promise<StoredCredentials | null> {
	const envCredentials = loadCredentialsFromEnv();
	if (envCredentials) {
		// Check for a persisted session cache that may have fresher tokens
		if (envCredentials.organizationId) {
			const cache = await loadSessionCache(envCredentials.organizationId);
			if (cache) {
				envCredentials.sealedSession = cache.sealedSession;
				envCredentials.refreshToken = cache.refreshToken;
			}
		}
		return envCredentials;
	}

	try {
		const data = await readFile(CREDENTIALS_FILE, 'utf-8');
		return JSON.parse(data) as StoredCredentials;
	} catch {
		return null;
	}
}

export async function loadCredentialsFromFile(): Promise<StoredCredentials | null> {
	try {
		const data = await readFile(CREDENTIALS_FILE, 'utf-8');
		return JSON.parse(data) as StoredCredentials;
	} catch {
		return null;
	}
}

export async function clearCredentials(): Promise<void> {
	try {
		await unlink(CREDENTIALS_FILE);
	} catch {
		// File might not exist
	}
}

export function getCredentialsPath(): string {
	return CREDENTIALS_FILE;
}
