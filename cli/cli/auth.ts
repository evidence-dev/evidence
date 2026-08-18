/**
 * WorkOS Device Authorization Flow for EVD CLI
 * https://workos.com/docs/authkit/authentication-methods/cli-auth
 */

import { hostname } from 'os';
import {
	saveCredentials,
	clearCredentials,
	loadCredentials,
	loadCredentialsFromFile,
	saveSessionCache,
	clearSessionCache,
	type StoredCredentials
} from './storage.ts';
import { printResult, resolveFormat, type OutputOptions } from './output.ts';
import type { APTIntrospectResponse } from '@evidence/core/types/apt';

const WORKOS_API = 'https://api.workos.com';

import { DEFAULT_WORKOS_CLIENT_ID } from './build-defaults.ts';
// Client ID is public (not a secret) - safe to embed.
// The adapter overwrites build-defaults.ts in temp-cli before Bun compiles,
// so cli:publish-dev bakes in staging credentials.
const DEFAULT_CLIENT_ID = DEFAULT_WORKOS_CLIENT_ID;

// Studio host for session creation endpoint
const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

// Management service host for APT operations
const MANAGEMENT_SERVICE_HOST = process.env.PUBLIC_MANAGEMENT_SERVICE_HOST || 'https://api.evidence.studio';

interface DeviceAuthResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete: string;
	expires_in: number;
	interval: number;
}

interface TokenResponse {
	user: {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		profile_picture_url: string | null;
	};
	organization_id: string | null;
	access_token: string;
	refresh_token: string;
}

interface TokenError {
	error: 'authorization_pending' | 'slow_down' | 'access_denied' | 'expired_token';
}

interface Organization {
	id: string;
	name: string;
}

/**
 * Outcome of an org fetch — lets callers distinguish a genuinely dead token
 * from a transient network failure (both used to collapse to an empty list).
 * - 'ok': token accepted; `organizations` is authoritative (may be empty)
 * - 'unauthorized': refresh token rejected (expired/revoked) — re-login required
 * - 'network-error': Studio unreachable or errored — token validity unknown
 */
export type OrgFetchStatus = 'ok' | 'unauthorized' | 'network-error';

export interface OrgFetchResult {
	organizations: Organization[];
	/** The rotated refresh token from the server (if returned) */
	refreshToken?: string;
	status: OrgFetchStatus;
}

/**
  * Fetch the user's organizations via Studio API.
  * The POST exchanges the refresh token server-side (authenticateWithRefreshToken),
  * so a successful call doubles as a token refresh and returns a rotated token.
  * (WorkOS API requires API key, so we proxy through Studio)
  * Also supports APT (Auth Proxy Token) - if aptToken is provided, it will be
  * introspected via the management service and the refreshToken will be used
  * only to authenticate the introspect call.
  */
 export async function fetchUserOrganizations(
 	refreshToken: string,
 	aptToken?: string
 ): Promise<OrgFetchResult> {
 	try {
 		const response = await fetch(`${STUDIO_HOST}/api/cli/organizations`, {
 			method: 'POST',
 			headers: { 'Content-Type': 'application/json' },
 			body: JSON.stringify({
 				refreshToken,
 				aptToken
 			})
 		});

 		// 401/403 means the refresh token itself was rejected — genuinely expired.
 		if (response.status === 401 || response.status === 403) {
 			return { organizations: [], status: 'unauthorized' };
 		}

 		// Any other non-OK (5xx, etc.) is a server hiccup, not proof of expiry.
 		if (!response.ok) {
 			return { organizations: [], status: 'network-error' };
 		}

 		const data = await response.json();
 		return {
 			organizations: data.organizations || [],
 			refreshToken: data.refreshToken || undefined,
 			status: 'ok'
 		};
 	} catch {
 		return { organizations: [], status: 'network-error' };
 	}
 }

// APT-first: refresh-token checks rotate a single-use token (races post-login and concurrent runs).
export async function verifyOrganizations(
	credentials: StoredCredentials
): Promise<OrgFetchResult> {
	if (credentials.aptToken) {
		const viaApt = await fetchUserOrganizations('', credentials.aptToken);
		if (viaApt.status !== 'unauthorized' || !credentials.refreshToken) return viaApt;
	}
	return fetchUserOrganizations(credentials.refreshToken);
}

/** Cached sealed session keyed by org (avoids repeated /api/cli/session calls) */
let cachedSealedSession: { orgId: string; session: string } | undefined;

/** Clear the in-memory session cache (e.g. before retrying after a 401) */
export function clearInMemorySessionCache(): void {
	cachedSealedSession = undefined;
}

/**
 * Ensure credentials have a sealed session, obtaining one if needed.
 * For env var credentials, persists the session cache to disk for cross-process reuse.
 * If APT is present, skip sealedSession entirely (APT is the primary auth).
 */
export async function ensureSessionResolved(
	credentials: StoredCredentials
): Promise<StoredCredentials> {
	// If APT is present, it's the primary auth - no sealedSession needed
	if (credentials.aptToken) return credentials;

	if (credentials.sealedSession) return credentials;

	// Check in-memory cache (keyed by org)
	if (cachedSealedSession?.orgId === credentials.organizationId) {
		credentials.sealedSession = cachedSealedSession.session;
		return credentials;
	}

	if (!credentials.organizationId) {
		throw new Error('No organization selected. Cannot create session.');
	}

	try {
		const response = await fetch(`${STUDIO_HOST}/api/cli/session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: credentials.refreshToken,
				organizationId: credentials.organizationId
			})
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`${response.status}: ${error}`);
		}

		const data = await response.json();
		if (!data.sealedSession) {
			throw new Error('Server returned OK but sealedSession was missing from response.');
		}
		credentials.sealedSession = data.sealedSession;
		cachedSealedSession = { orgId: credentials.organizationId!, session: data.sealedSession };

		// Track rotated refresh token
		if (data.refreshToken) {
			credentials.refreshToken = data.refreshToken;
		}

		if (credentials.fromEnv) {
			// Persist session cache for cross-process reuse
			await saveSessionCache(
				data.sealedSession,
				credentials.refreshToken,
				credentials.organizationId!
			);
		} else {
			await saveCredentials(credentials);
		}
	} catch (err) {
		if (credentials.fromEnv) {
			// Clear stale session cache since the token is invalid
			await clearSessionCache();
			throw new Error(
				`Failed to create session from EVIDENCE_AUTH_TOKEN: ${err}\n  The token may be expired. Run \`evidence login\` and \`evidence token\` to generate a new one.`
			);
		}
		console.error(`  Warning: could not create sealed session: ${err}`);
	}

	return credentials;
}

function getClientId(): string {
	// Allow env var override, but fall back to embedded default
	return process.env.WORKOS_CLIENT_ID || DEFAULT_CLIENT_ID;
}

async function requestDeviceAuthorization(clientId: string): Promise<DeviceAuthResponse> {
	const response = await fetch(`${WORKOS_API}/user_management/authorize/device`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({ client_id: clientId })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to request device authorization: ${error}`);
	}

	return response.json();
}

async function pollForTokens(
	clientId: string,
	deviceCode: string,
	expiresIn: number,
	interval: number
): Promise<TokenResponse> {
	const deadline = Date.now() + expiresIn * 1000;
	let pollInterval = interval;

	while (Date.now() < deadline) {
		const response = await fetch(`${WORKOS_API}/user_management/authenticate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
				device_code: deviceCode,
				client_id: clientId
			})
		});

		const data = await response.json();

		if (response.ok) {
			return data as TokenResponse;
		}

		const error = data as TokenError;

		switch (error.error) {
			case 'authorization_pending':
				// Wait and try again
				await sleep(pollInterval * 1000);
				break;
			case 'slow_down':
				// Increase interval
				pollInterval += 1;
				await sleep(pollInterval * 1000);
				break;
			case 'access_denied':
				throw new Error('Authorization denied by user');
			case 'expired_token':
				throw new Error('Authorization expired. Please try again.');
			default:
				throw new Error(`Authorization failed: ${JSON.stringify(data)}`);
		}
	}

	throw new Error('Authorization timed out. Please try again.');
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Read a claim from a JWT payload without verifying the signature. */
export function decodeJwtClaim(token: string, claim: string): string | undefined {
	try {
		const payload = token.split('.')[1];
		if (!payload) return undefined;
		const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
		const value = json[claim];
		return typeof value === 'string' ? value : undefined;
	} catch {
		return undefined;
	}
}

export function openBrowser(url: string, opts: { background?: boolean } = {}): void {
	const { spawn } = require('child_process');
	const platform = process.platform;

	// `background` opens the page without stealing focus (used for logout, where
	// the user doesn't need to see the WorkOS logout redirect).
	const [cmd, args]: [string, string[]] =
		platform === 'darwin'
			? ['open', opts.background ? ['-g', url] : [url]]
			: platform === 'win32'
				? ['cmd', opts.background ? ['/c', 'start', '/min', '', url] : ['/c', 'start', '', url]]
				: ['xdg-open', [url]];

	try {
		const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
		child.on('error', () => {});
		child.unref();
	} catch {
		// best-effort; the user can open the URL manually
	}
}

/**
 * Creates an Auth Proxy Token (APT) for CLI use.
 * Calls the Studio API to create an APT and returns the token and introspect data.
 */
async function createCLIToken(
	refreshToken: string,
	organizationId: string
): Promise<{ token: string; tokenHash: string; introspect: APTIntrospectResponse; refreshToken: string }> {
	const response = await fetch(`${STUDIO_HOST}/api/cli/apt`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			refreshToken,
			organizationId,
			hostname: hostname()
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`${response.status}: ${error}`);
	}

	const data = await response.json();
	return {
		token: data.token,
		tokenHash: data.tokenHash,
		introspect: data.introspect,
		refreshToken: data.refreshToken
	};
}

/**
 * Revokes an Auth Proxy Token (APT).
 * Calls the management service DELETE /v1/auth/apt/token directly with the sealed session.
 */
async function revokeCLIToken(
	tokenHash: string,
	sealedSession: string
): Promise<void> {
	const response = await fetch(`${MANAGEMENT_SERVICE_HOST}/v1/auth/apt/token`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `wos-session=${sealedSession}`
		},
		body: JSON.stringify({ tokenHash })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`${response.status}: ${error}`);
	}
}

export async function login(): Promise<StoredCredentials> {
	const clientId = getClientId();

	// Capture existing APT for revocation after new one is created
	const existingCredentials = await loadCredentialsFromFile();
	const oldAptTokenHash = existingCredentials?.aptIntrospect?.tokenHash;
	const oldSealedSession = existingCredentials?.sealedSession;

	// Step 1: Request device authorization
	const deviceAuth = await requestDeviceAuthorization(clientId);

	// Step 2: Display code and open browser (single line for Cursor preview)
	console.error(
		`  Code: ${deviceAuth.user_code} — Opening browser to ${deviceAuth.verification_uri}`
	);

	// Open browser with pre-filled code
	openBrowser(deviceAuth.verification_uri_complete);

	// Step 3: Poll for tokens
	const tokens = await pollForTokens(
		clientId,
		deviceAuth.device_code,
		deviceAuth.expires_in,
		deviceAuth.interval
	);

	// Step 4: Exchange refresh token for sealed session via Studio API
	let sealedSession: string | undefined;
	let refreshToken = tokens.refresh_token;

	try {
		const sessionResponse = await fetch(`${STUDIO_HOST}/api/cli/session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: tokens.refresh_token,
				organizationId: tokens.organization_id
			})
		});

		if (!sessionResponse.ok) {
			const error = await sessionResponse.text();
			throw new Error(`${sessionResponse.status}: ${error}`);
		}

		const sessionData = await sessionResponse.json();
		sealedSession = sessionData.sealedSession;
		// Use the rotated refresh token if returned
		if (sessionData.refreshToken) {
			refreshToken = sessionData.refreshToken;
		}
	} catch (err) {
		console.error(`  Warning: could not create sealed session: ${err}`);
		console.error('  Query console may not work.\n');
	}

	// Step 5: Store credentials (with the latest refresh token)
	const credentials: StoredCredentials = {
		accessToken: tokens.access_token,
		refreshToken,
		sealedSession,
		user: {
			id: tokens.user.id,
			email: tokens.user.email,
			firstName: tokens.user.first_name,
			lastName: tokens.user.last_name,
			profilePictureUrl: tokens.user.profile_picture_url
		},
		organizationId: tokens.organization_id
	};

	await saveCredentials(credentials);

	// Step 6: Create CLI APT token
	if (!tokens.organization_id) {
		throw new Error('No organization returned from authentication. Please try again.');
	}
	const aptResult = await createCLIToken(refreshToken, tokens.organization_id);
	credentials.aptToken = aptResult.token;
	credentials.aptIntrospect = aptResult.introspect;
	credentials.refreshToken = aptResult.refreshToken; // Use the rotated refresh token
	await saveCredentials(credentials);

	// Revoke old APT token if one existed — best-effort, don't fail login
	if (oldAptTokenHash && oldSealedSession) {
		try {
			await revokeCLIToken(oldAptTokenHash, oldSealedSession);
		} catch (err) {
			console.error(`  Warning: could not revoke previous CLI token: ${err}`);
		}
	}

	console.error(`  Logged in as ${tokens.user.email}`);
	console.error(`  Tip: Run \`evidence token\` to get an auth token for headless/CI use.\n`);

	return credentials;
}

export async function logout(): Promise<void> {
	// End the browser's WorkOS AuthKit session too, otherwise it survives and the
	// next `login` silently re-approves the same account. Opened in the background
	// so the WorkOS logout redirect doesn't steal focus.
	const credentials = await loadCredentialsFromFile();
	const sessionId = credentials?.accessToken
		? decodeJwtClaim(credentials.accessToken, 'sid')
		: undefined;
	if (sessionId) {
		openBrowser(`${WORKOS_API}/user_management/sessions/logout?session_id=${sessionId}`, {
			background: true
		});
	}

	// Revoke APT token if present
	if (credentials?.aptIntrospect?.tokenHash && credentials?.sealedSession) {
		try {
			await revokeCLIToken(credentials.aptIntrospect.tokenHash, credentials.sealedSession);
		} catch (err) {
			console.error(`  Warning: could not revoke CLI token: ${err}`);
		}
	}

	await clearCredentials();
	await clearSessionCache();
	console.error('  Logged out\n');
}

export async function getCredentials(): Promise<StoredCredentials | null> {
	return loadCredentials();
}

export interface AuthStatus {
	loggedIn: boolean;
	/** Stored refresh token was rejected (expired/revoked) — re-login required */
	expired?: boolean;
	/** Have cached credentials but couldn't reach Studio to verify them */
	unverified?: boolean;
	email?: string;
	orgName?: string | null;
	hasApt?: boolean;
}

export async function getAuthStatus(): Promise<AuthStatus> {
	const credentials = await loadCredentials();
	if (!credentials) {
		return { loggedIn: false };
	}

	const email =
		credentials.user.email || (credentials.fromEnv ? 'Authenticated via EVIDENCE_AUTH_TOKEN' : undefined);

	const { organizations, refreshToken: newToken, status } = await verifyOrganizations(credentials);

	// Refresh token rejected — expired/revoked regardless of credential source.
	if (status === 'unauthorized') {
		return { loggedIn: false, expired: true, email };
	}

	// Couldn't reach Studio — don't lock the user out over a blip; show cached identity unverified.
	if (status === 'network-error') {
		return { loggedIn: true, unverified: true, email, orgName: null };
	}

	// Track rotated token
	if (newToken) {
		credentials.refreshToken = newToken;
		if (credentials.fromEnv) {
			if (credentials.organizationId && credentials.sealedSession) {
				await saveSessionCache(credentials.sealedSession, newToken, credentials.organizationId);
			}
		} else {
			await saveCredentials(credentials);
		}
	}

	const currentOrg = organizations.find((org) => org.id === credentials.organizationId);

	return {
		loggedIn: true,
		email,
		orgName: currentOrg?.name ?? null,
		hasApt: !!credentials.aptToken
	};
}

export async function ensureAuthenticated(): Promise<StoredCredentials> {
	const credentials = await loadCredentials();

	// No credentials at all. Only auto-launch the browser flow in an interactive
	// terminal — never surprise-open a browser in CI/agent/piped contexts.
	if (!credentials) {
		if (!process.stdin.isTTY) {
			throw new Error('Not logged in. Run `evidence login` to authenticate.');
		}
		return login();
	}

	// Verify credentials are alive; persist any rotated token before ensureSessionResolved reuses it.
	const { refreshToken: newToken, status } = await verifyOrganizations(credentials);

	if (status === 'unauthorized') {
		// Stale sealed session is useless regardless of how we proceed.
		await clearSessionCache();
		clearInMemorySessionCache();

		// EVIDENCE_AUTH_TOKEN can't be refreshed interactively.
		if (credentials.fromEnv) {
			throw new Error(
				'EVIDENCE_AUTH_TOKEN has expired or been revoked. Generate a new one with `evidence login` then `evidence token`.'
			);
		}

		// Non-interactive (CI/piped/agent) — fail loudly. Critically, leave the stored
		// credentials in place: deleting them would route the next run into the no-creds
		// branch above and surprise-open a browser.
		if (!process.stdin.isTTY) {
			throw new Error('Session expired. Run `evidence login` to sign in again.');
		}

		// Interactive — the dead credentials are about to be overwritten by login().
		await clearCredentials();
		console.log('  Session expired — signing you in again.\n');
		return login();
	}

	// Couldn't reach Studio — proceed with cached credentials (offline dev).
	if (status === 'network-error') {
		console.error(
			'  Warning: could not verify session (offline?). Continuing with cached credentials.\n'
		);
		return ensureSessionResolved(credentials);
	}

	// status === 'ok' — persist the rotated token before resolving the session.
	if (newToken) {
		credentials.refreshToken = newToken;
		if (credentials.fromEnv) {
			if (credentials.organizationId && credentials.sealedSession) {
				await saveSessionCache(credentials.sealedSession, newToken, credentials.organizationId);
			}
		} else {
			await saveCredentials(credentials);
		}
	}

	// Backfill APT if missing — lazy creation for users who logged in before APT support
	// or whose APT creation failed silently. Only create if we have a valid refresh token.
	if (!credentials.aptToken && credentials.refreshToken && credentials.organizationId) {
		try {
			const aptResult = await createCLIToken(credentials.refreshToken, credentials.organizationId);
			credentials.aptToken = aptResult.token;
			credentials.aptIntrospect = aptResult.introspect;
			credentials.refreshToken = aptResult.refreshToken; // Use the rotated refresh token
			if (!credentials.fromEnv) {
				await saveCredentials(credentials);
			}
		} catch (err) {
			// Best-effort: if APT creation fails, continue with legacy auth.
			// The user will see warnings on subsequent commands if needed.
		}
	}

	return ensureSessionResolved(credentials);
}

export async function whoami(opts: OutputOptions): Promise<void> {
	// Default is machine-readable JSON `{ user, org }`; --verbose shows the
	// human lines.
	const asJson = resolveFormat(opts, 'structured') !== 'table';
	const credentials = await loadCredentials();

	if (!credentials) {
		if (asJson) {
			printResult({ kind: 'structured', value: { user: null, org: null } }, opts);
		} else {
			console.log('  Not logged in. Run `evidence login` to authenticate.\n');
		}
		return;
	}

	const viaEnv = credentials.fromEnv === true;
	const identity = viaEnv ? 'Authenticated via EVIDENCE_AUTH_TOKEN' : credentials.user.email;
	const name = viaEnv
		? ''
		: [credentials.user.firstName, credentials.user.lastName].filter(Boolean).join(' ');

	const { organizations, refreshToken: newToken, status } = await verifyOrganizations(credentials);

	// Refresh token rejected — the session is genuinely expired, not just the access token.
	// Don't print cached identity as if it were usable.
	if (status === 'unauthorized') {
		if (asJson) {
			printResult({ kind: 'structured', value: { user: null, org: null } }, opts);
			return;
		}
		if (viaEnv) {
			console.log('  EVIDENCE_AUTH_TOKEN has expired or been revoked.');
			console.log('  Run `evidence login` and `evidence token` to generate a new one.\n');
		} else {
			console.log(`  ${identity} — session expired`);
			console.log('  Run `evidence login` to sign in again.\n');
		}
		return;
	}

	// Couldn't reach Studio — show cached identity but be honest that it's unverified,
	// rather than claiming the token is expired.
	if (status === 'network-error') {
		if (asJson) {
			printResult({ kind: 'structured', value: { user: identity, org: null } }, opts);
			return;
		}
		console.log(`  ${identity}`);
		if (name) console.log(`  ${name}`);
		console.log('  (offline — could not verify session)\n');
		return;
	}

 	// status === 'ok' — token is valid; persist any rotated refresh token.
	if (newToken) {
		credentials.refreshToken = newToken;
		if (viaEnv) {
			if (credentials.organizationId && credentials.sealedSession) {
				await saveSessionCache(credentials.sealedSession, newToken, credentials.organizationId);
			}
		} else {
			await saveCredentials(credentials);
		}
	}

	const currentOrg = organizations.find((org) => org.id === credentials.organizationId);
	const orgName = currentOrg?.name ?? credentials.organizationId ?? null;

	// Report APT state
	const hasApt = !!credentials.aptToken;
	if (!hasApt && !viaEnv) {
		console.log('  Warning: No APT token found. Run `evidence token` to create one for headless/CI use.');
	}

	if (viaEnv) {
		const user = credentials.user.email || 'EVIDENCE_AUTH_TOKEN';
		if (asJson) {
			printResult({ kind: 'structured', value: { user, org: orgName } }, opts);
			return;
		}
		console.log('  Authenticated via EVIDENCE_AUTH_TOKEN');
		if (organizations.length === 0) {
			console.log('  Warning: Could not verify token. It may be expired.');
			console.log('  Run `evidence login` and `evidence token` to generate a new one.');
		}
		if (orgName) console.log(`  Organization: ${orgName}`);
		console.log('');
		return;
	}

	if (asJson) {
		printResult({ kind: 'structured', value: { user: credentials.user.email, org: orgName } }, opts);
		return;
	}

	console.log(`  ${identity}`);
	if (name) console.log(`  ${name}`);
	if (currentOrg) console.log(`  Organization: ${currentOrg.name}`);
	else if (credentials.organizationId) console.log(`  Organization: ${credentials.organizationId}`);
	console.log('');
}

export async function listOrgs(): Promise<void> {
	const credentials = await loadCredentials();

	if (!credentials) {
		console.log('  Not logged in. Run `evidence login` to authenticate.\n');
		return;
	}

	const { organizations, refreshToken: newToken, status } = await verifyOrganizations(credentials);

	if (status === 'unauthorized') {
		console.log('  Session expired. Run `evidence login` to sign in again.\n');
		return;
	}
	if (status === 'network-error') {
		console.log('  Could not reach Evidence to list organizations (offline?).\n');
		return;
	}

	// Track rotated token
	if (newToken) {
		credentials.refreshToken = newToken;
		if (credentials.fromEnv) {
			if (credentials.organizationId && credentials.sealedSession) {
				await saveSessionCache(credentials.sealedSession, newToken, credentials.organizationId);
			}
		} else {
			await saveCredentials(credentials);
		}
	}

	// Report APT state
	if (!credentials.aptToken && !credentials.fromEnv) {
		console.log('  Warning: No APT token found. Run `evidence token` to create one for headless/CI use.');
	}

	if (organizations.length === 0) {
		console.log('  No organizations found.\n');
		return;
	}

	console.log(`  Organizations (${organizations.length}):\n`);

	for (const org of organizations) {
		const isCurrent = org.id === credentials.organizationId;
		const marker = isCurrent ? '→' : ' ';
		const suffix = isCurrent ? ' (current)' : '';
		console.log(`  ${marker} ${org.name}${suffix}`);
		console.log(`      ${org.id}`);
	}
	console.log('');
	console.log('  Use `evidence switch <name>` to switch organizations.\n');
}

export async function switchOrg(identifier: string): Promise<void> {
	const credentials = await loadCredentials();

	if (!credentials) {
		console.log('  Not logged in. Run `evidence login` to authenticate.\n');
		return;
	}

	// Fetch current orgs from Studio API
	const { organizations, refreshToken: newToken, status } = await verifyOrganizations(credentials);

	if (status === 'unauthorized') {
		console.log('  Session expired. Run `evidence login` to sign in again.\n');
		return;
	}
	if (status === 'network-error') {
		console.log('  Could not reach Evidence to switch organizations (offline?).\n');
		return;
	}

	// Track rotated token
	if (newToken) {
		credentials.refreshToken = newToken;
	}

	// Find org by name (case-insensitive) or ID
	const targetOrg = organizations.find(
		(org) =>
			org.id === identifier ||
			org.name.toLowerCase() === identifier.toLowerCase() ||
			org.name.toLowerCase().includes(identifier.toLowerCase())
	);

	if (!targetOrg) {
		console.log(`  Organization not found: "${identifier}"\n`);
		if (organizations.length > 0) {
			console.log('  Available organizations:');
			for (const org of organizations) {
				console.log(`    - ${org.name}`);
			}
			console.log('');
		}
		return;
	}

	if (targetOrg.id === credentials.organizationId) {
		console.log(`  Already on organization: ${targetOrg.name}\n`);
		return;
	}

	// Get new sealed session for the target org
	let sealedSession: string | undefined;
	try {
		const sessionResponse = await fetch(`${STUDIO_HOST}/api/cli/session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: credentials.refreshToken,
				organizationId: targetOrg.id
			})
		});

		if (!sessionResponse.ok) {
			const error = await sessionResponse.text();
			throw new Error(`${sessionResponse.status}: ${error}`);
		}

		const sessionData = await sessionResponse.json();
		sealedSession = sessionData.sealedSession;
		// Track rotated token from session endpoint
		if (sessionData.refreshToken) {
			credentials.refreshToken = sessionData.refreshToken;
		}
	} catch (err) {
		console.error(`  Warning: could not create sealed session: ${err}`);
		console.error('  Queries may not work. Try `evidence login` to re-authenticate.\n');
	}

	// Capture old APT token hash and sealed session for revocation after new one is created
	// Do this BEFORE any changes to credentials (which would overwrite sealedSession and aptIntrospect)
	const oldAptTokenHash = credentials.aptIntrospect?.tokenHash;
	const oldSealedSession = credentials.sealedSession;

	// Update credentials with new org
	credentials.organizationId = targetOrg.id;
	credentials.sealedSession = sealedSession;

	// Create new APT token
	let aptResult: { token: string; introspect: APTIntrospectResponse; refreshToken: string } | undefined;
	try {
		aptResult = await createCLIToken(credentials.refreshToken, targetOrg.id);
		credentials.aptToken = aptResult.token;
		credentials.aptIntrospect = aptResult.introspect;
		credentials.refreshToken = aptResult.refreshToken; // Use the rotated refresh token
	} catch (err) {
		console.error(`  Warning: could not create CLI token for new org: ${err}`);
	}

	// Revoke old APT only after new one is successfully created
	if (oldAptTokenHash && oldSealedSession && aptResult) {
		try {
			await revokeCLIToken(oldAptTokenHash, oldSealedSession);
		} catch (err) {
			console.error(`  Warning: could not revoke old CLI token: ${err}`);
		}
	}

	// Only persist to file if credentials came from file (not env var)
	if (credentials.fromEnv) {
		// Persist session cache so subsequent CLI invocations use the new org session
		if (credentials.sealedSession && credentials.organizationId) {
			await saveSessionCache(
				credentials.sealedSession,
				credentials.refreshToken,
				credentials.organizationId
			);
		}
		console.log(`  Switched to ${targetOrg.name} (for this session only)\n`);
		console.log('  Note: EVIDENCE_AUTH_TOKEN is set, so this change will not persist.');
		console.log('  To permanently switch, update the organizationId in your token.\n');
	} else {
		await saveCredentials(credentials);
		console.log(`  Switched to ${targetOrg.name}\n`);
	}
}

export async function generateToken(): Promise<void> {
	const credentials = await loadCredentialsFromFile();

	if (!credentials) {
		console.log('  Not logged in. Run `evidence login` first.\n');
		return;
	}

	if (!credentials.organizationId) {
		console.log('  No organization selected. Run `evidence switch <org>` first.\n');
		return;
	}

	// If we already have an APT, output it as base64-encoded JSON
	// APT-only format: { aptToken, organizationId } - the management endpoints now accept APT directly
	if (credentials.aptToken) {
		const tokenPayload = Buffer.from(
			JSON.stringify({
				aptToken: credentials.aptToken,
				organizationId: credentials.organizationId
			})
		).toString('base64');
		console.log(
			`  Token generated for organization: ${credentials.organizationId}\n`
		);
		console.log('  Set this environment variable to authenticate without interactive login:\n');
		console.log(`  EVIDENCE_AUTH_TOKEN=${tokenPayload}\n`);
		console.log('  Treat it as a secret — it contains a long-lived access token.\n');
		return;
	}

	// Always fetch a fresh sealed session so the token starts with a valid one
	try {
		const sessionResponse = await fetch(`${STUDIO_HOST}/api/cli/session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: credentials.refreshToken,
				organizationId: credentials.organizationId
			})
		});

		if (sessionResponse.ok) {
			const sessionData = await sessionResponse.json();
			credentials.sealedSession = sessionData.sealedSession;
			if (sessionData.refreshToken) {
				credentials.refreshToken = sessionData.refreshToken;
			}
			await saveCredentials(credentials);
		}
	} catch {
		// Continue without sealed session — the refresh token alone can still work
	}

	// Also validates the credentials — don't mint a token from dead ones.
	const { organizations, refreshToken: newToken, status } = await verifyOrganizations(credentials);

	if (status === 'unauthorized') {
		console.log('  Session expired. Run `evidence login` to sign in again.\n');
		return;
	}
	// network-error: the refresh token wasn't rejected, just unverifiable — still safe
	// to emit (the org name falls back to the id below).

	// Track rotated token from org fetch
	if (newToken) {
		credentials.refreshToken = newToken;
		await saveCredentials(credentials);
	}

	// Create APT token
	const aptResult = await createCLIToken(credentials.refreshToken, credentials.organizationId);
	credentials.aptToken = aptResult.token;
	credentials.aptIntrospect = aptResult.introspect;
	credentials.refreshToken = aptResult.refreshToken; // Use the rotated refresh token
	await saveCredentials(credentials);

	const currentOrg = organizations.find((org) => org.id === credentials.organizationId);
	const tokenPayload = Buffer.from(
		JSON.stringify({
			aptToken: credentials.aptToken,
			organizationId: credentials.organizationId
		})
	).toString('base64');

	console.log(
		`  Token generated for organization: ${currentOrg?.name ?? credentials.organizationId}\n`
	);
	console.log('  Set this environment variable to authenticate without interactive login:\n');
	console.log(`  EVIDENCE_AUTH_TOKEN=${tokenPayload}\n`);
	console.log('  Treat it as a secret — it contains a long-lived access token.\n');
}
