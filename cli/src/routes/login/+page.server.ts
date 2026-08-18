/**
 * Login page server load
 * Redirects to home if already authenticated
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { loadCredentials } from '$lib/auth/credentials.server';
import { getProjectCwd } from '$lib/server/project-cwd';

export const load: PageServerLoad = async () => {
	// Check if credentials exist (don't validate on every request)
	const credentials = await loadCredentials();

	// Already authenticated, or a local connection.yaml project that needs no
	// login — either way there's no reason to sit on the login wall.
	const hasLocalConnection = existsSync(path.join(getProjectCwd(), 'connection.yaml'));
	if (credentials?.organizationId || hasLocalConnection) {
		redirect(302, '/');
	}

	return {
		authenticated: false
	};
};
