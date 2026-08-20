import { select, text, isCancel, cancel } from '@clack/prompts';
import { login, verifyOrganizations, openBrowser } from './auth.ts';
import { signup } from './signup.ts';
import { loadCredentials, saveCredentials } from './storage.ts';
import type { StoredCredentials } from './storage.ts';

export const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

export async function postJson(
	pathname: string,
	body: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const response = await fetch(`${STUDIO_HOST}${pathname}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		const text = await response.text();
		// Studio error bodies are `{ message }`; surface that rather than raw JSON.
		let detail = text;
		try {
			const parsed = JSON.parse(text);
			if (parsed && typeof parsed.message === 'string') detail = parsed.message;
		} catch {
			// non-JSON body — use as-is
		}
		throw new Error(`${response.status}: ${detail}`);
	}
	return response.json();
}

// The refresh token rotates on most Studio calls; persist the new one (unless
// credentials came from EVIDENCE_AUTH_TOKEN, which the CLI must not overwrite).
export async function trackRotatedToken(
	credentials: StoredCredentials,
	newToken: string | undefined
): Promise<void> {
	if (!newToken || newToken === credentials.refreshToken) return;
	credentials.refreshToken = newToken;
	if (!credentials.fromEnv) {
		await saveCredentials(credentials);
	}
}

export async function resolveCredentials(): Promise<StoredCredentials> {
	// No eager session resolution — each request authenticates with
	// refreshToken + organizationId, and resolving here throws for a logged-in
	// account that has no workspace yet (the case org resolution onboards).
	const existing = await loadCredentials();
	if (existing) return existing;

	if (!process.stdin.isTTY) {
		console.log('\n  Not logged in.');
		console.log('    • New to Evidence?          run `evidence signup`');
		console.log('    • Already have an account?  run `evidence login`\n');
		process.exit(1);
	}

	const choice = await select({
		message: 'Not logged in — what would you like to do?',
		options: [
			{ value: 'signup', label: 'Sign up', hint: "I'm new to Evidence" },
			{ value: 'login', label: 'Log in', hint: 'I already have an account' }
		]
	});

	if (isCancel(choice)) {
		cancel('Cancelled.');
		process.exit(1);
	}

	if (choice === 'signup') {
		await signup(); // opens the browser and exits
	}
	return login();
}

// Project name for a newly-created project: explicit --name wins; otherwise
// prompt (prefilled, editable) in a TTY, or fall back to the default.
export async function resolveProjectName(
	defaultName: string,
	explicit: string | null
): Promise<string> {
	if (explicit) return explicit;
	if (!process.stdin.isTTY) return defaultName;

	const answer = await text({
		message: 'Project name',
		initialValue: defaultName,
		defaultValue: defaultName
	});
	if (isCancel(answer)) {
		cancel('Cancelled.');
		process.exit(1);
	}
	return answer.trim() || defaultName;
}

/**
 * Resolve the organization to operate against, handling the three workspace
 * states a user can be in:
 *   - no workspace yet → open onboarding, print resume instructions, exit 0
 *   - exactly one org → use it
 *   - multiple orgs → pick (TTY) or use the stored current org (non-TTY)
 *
 * Persists the chosen org id and any rotated refresh token.
 */
export async function resolveOrganization(credentials: StoredCredentials): Promise<string> {
	const { organizations, refreshToken, status } = await verifyOrganizations(credentials);
	await trackRotatedToken(credentials, refreshToken);

	if (status === 'unauthorized') {
		console.error('\n  Your session has expired. Run `evidence login` and try again.\n');
		process.exit(1);
	}
	// Can't reach Studio: trust a stored org id rather than treating an empty
	// list as "no workspace" (which would wrongly send the user to onboarding).
	if (status === 'network-error') {
		if (credentials.organizationId) return credentials.organizationId;
		console.error('\n  Could not reach Evidence Studio to look up your workspace. Try again.\n');
		process.exit(1);
	}

	if (organizations.length === 0) {
		const onboardingUrl = `${STUDIO_HOST}/new-organization`;
		const signedInAs = credentials.user.email
			? `You're signed in as ${credentials.user.email}, but`
			: "You're signed in, but";
		console.log('');
		console.log(`  ${signedInAs} you don't have an Evidence workspace yet.`);
		console.log('  Finish setting up your workspace here, then run `evidence launch` again:');
		console.log(`\n    ${onboardingUrl}\n`);
		openBrowser(onboardingUrl);
		// Incomplete: no workspace yet. Exit non-zero so a non-interactive caller
		// doesn't treat the launch as finished.
		process.exit(1);
	}

	const current = credentials.organizationId ?? null;

	if (organizations.length === 1) {
		return persistOrg(credentials, organizations[0].id);
	}

	// Multiple orgs.
	if (!process.stdin.isTTY) {
		if (current) return persistOrg(credentials, current);
		console.error(
			'\n  You belong to multiple workspaces. Pick one with `evidence switch <name>` first,'
		);
		console.error('  or run `evidence launch` in an interactive terminal.\n');
		process.exit(1);
	}

	const picked = await select({
		message: 'Which Evidence workspace?',
		initialValue: current ?? organizations[0].id,
		options: organizations.map((o) => ({ value: o.id, label: o.name ?? o.id }))
	});
	if (isCancel(picked)) {
		cancel('Cancelled.');
		process.exit(1);
	}
	return persistOrg(credentials, picked as string);
}

async function persistOrg(credentials: StoredCredentials, orgId: string): Promise<string> {
	if (credentials.organizationId !== orgId) {
		credentials.organizationId = orgId;
		if (!credentials.fromEnv) await saveCredentials(credentials);
	}
	return orgId;
}
