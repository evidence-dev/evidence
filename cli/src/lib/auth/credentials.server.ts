/**
 * Credentials management for CLI authentication
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { clearOrgWarehouseCache } from '$cli/org-warehouse';

export interface StoredCredentials {
	accessToken: string;
	refreshToken: string;
	/** Sealed session cookie for query engine auth */
	sealedSession?: string;
	user: {
		id: string;
		email: string;
		firstName?: string | null;
		lastName?: string | null;
		profilePictureUrl?: string | null;
	};
	organizationId: string | null;
	/** True when credentials were loaded from EVIDENCE_AUTH_TOKEN env var */
	fromEnv?: boolean;
}

const EVD_DIR = join(homedir(), '.evd');
const CREDENTIALS_FILE = join(EVD_DIR, 'credentials.json');
const SESSION_CACHE_FILE = join(EVD_DIR, 'session-cache.json');

/** Maximum age (ms) for a cached session before it's considered stale */
const SESSION_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionCache {
	sealedSession: string;
	refreshToken: string;
	organizationId: string;
	timestamp: number;
}

async function ensureDir(): Promise<void> {
	try {
		await mkdir(EVD_DIR, { recursive: true, mode: 0o700 });
	} catch {
		// Directory might already exist
	}
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

function loadCredentialsFromEnv(): StoredCredentials | null {
	const token = process.env.EVIDENCE_AUTH_TOKEN;
	if (!token) return null;

	try {
		const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

		if (!decoded.refreshToken || !decoded.organizationId) {
			console.error(
				'Warning: EVIDENCE_AUTH_TOKEN is missing required fields (refreshToken, organizationId).'
			);
			return null;
		}

		return {
			accessToken: '',
			refreshToken: decoded.refreshToken,
			sealedSession: decoded.sealedSession || undefined,
			organizationId: decoded.organizationId,
			user: { id: '', email: '' },
			fromEnv: true
		};
	} catch {
		console.error('Warning: EVIDENCE_AUTH_TOKEN is malformed (expected base64-encoded JSON).');
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

/** Cached sealed session keyed by org (avoids repeated /api/cli/session calls) */
let cachedSealedSession: { orgId: string; session: string } | undefined;

// Offline or slow Studio: back off instead of re-fetching (and re-warning) on every page load.
const SESSION_RETRY_BACKOFF_MS = 60 * 1000;
const SESSION_FETCH_TIMEOUT_MS = 5000;
let lastSessionFailure: { orgId: string; at: number } | undefined;
// Bumped by logout / org switch / login so a late session exchange can't resurrect stale credentials.
let credentialsGeneration = 0;

/**
 * Clear the in-memory session cache (e.g. after a 401/403 from the query engine).
 * `keepBackoff`: a rejection that never used a sealed session says nothing about Studio's
 * reachability, so it must not cut short the retry backoff.
 */
export function clearSessionCache({ keepBackoff = false }: { keepBackoff?: boolean } = {}): void {
	cachedSealedSession = undefined;
	if (!keepBackoff) lastSessionFailure = undefined;
	clearOrgWarehouseCache();
}

/**
 * Ensure credentials have a sealed session, obtaining one if needed.
 * For env var credentials, caches in-memory only (no disk writes).
 */
export async function ensureSessionResolved(
	credentials: StoredCredentials,
	studioHost: string
): Promise<StoredCredentials> {
	if (credentials.sealedSession) return credentials;

	// Check in-memory cache (keyed by org)
	if (cachedSealedSession?.orgId === credentials.organizationId) {
		credentials.sealedSession = cachedSealedSession.session;
		return credentials;
	}

	if (!credentials.organizationId) {
		throw new Error('No organization selected. Cannot create session.');
	}

	if (
		!credentials.fromEnv &&
		lastSessionFailure?.orgId === credentials.organizationId &&
		Date.now() - lastSessionFailure.at < SESSION_RETRY_BACKOFF_MS
	) {
		return credentials;
	}

	const organizationId = credentials.organizationId;
	// Never abort the exchange itself: it spends the single-use refresh token, so it must be
	// allowed to finish and save the replacement even after we stop waiting for it.
	const exchange = exchangeSession(credentials, studioHost, organizationId);
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const outcome = await Promise.race([
			exchange.then(() => 'done' as const),
			new Promise<'timeout'>((resolve) => {
				timer = setTimeout(() => resolve('timeout'), SESSION_FETCH_TIMEOUT_MS);
			})
		]);
		if (outcome === 'timeout') {
			exchange.catch(() => {
				lastSessionFailure = { orgId: organizationId, at: Date.now() };
			});
			throw new Error(`Evidence Studio did not respond within ${SESSION_FETCH_TIMEOUT_MS}ms`);
		}
	} catch (err) {
		if (credentials.fromEnv) {
			throw new Error(
				`Failed to create session from EVIDENCE_AUTH_TOKEN: ${err}\n  The token may be expired. Run \`evidence login\` and \`evidence token\` to generate a new one.`
			);
		}
		lastSessionFailure = { orgId: organizationId, at: Date.now() };
		console.error(`  Warning: could not create sealed session: ${err}`);
	} finally {
		clearTimeout(timer);
	}

	return credentials;
}

async function exchangeSession(
	credentials: StoredCredentials,
	studioHost: string,
	organizationId: string
): Promise<void> {
	const generation = credentialsGeneration;
	const response = await fetch(`${studioHost}/api/cli/session`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken: credentials.refreshToken, organizationId })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create session: ${response.status}: ${error}`);
	}

	const data = await response.json();
	if (!data.sealedSession) {
		throw new Error('Server returned OK but sealedSession was missing from response.');
	}
	if (generation !== credentialsGeneration) return;

	credentials.sealedSession = data.sealedSession;
	cachedSealedSession = { orgId: organizationId, session: data.sealedSession };
	lastSessionFailure = undefined;

	// Track rotated refresh token
	if (data.refreshToken) {
		credentials.refreshToken = data.refreshToken;
	}

	// Persist to file only if credentials came from file
	if (!credentials.fromEnv) {
		await writeCredentialsFile(credentials);
	}
}

export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
	credentialsGeneration++;
	await writeCredentialsFile(credentials);
}

async function writeCredentialsFile(credentials: StoredCredentials): Promise<void> {
	await ensureDir();
	await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
		encoding: 'utf-8',
		mode: 0o600
	});
}

export async function clearCredentials(): Promise<void> {
	credentialsGeneration++;
	try {
		await unlink(CREDENTIALS_FILE);
	} catch {
		// File may not exist, that's fine
	}
}
