/**
 * Auth status endpoint
 * Returns whether the user is authenticated
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadCredentials } from '$lib/auth/credentials.server';

export const GET: RequestHandler = async () => {
	// Just check if credentials exist
	const credentials = await loadCredentials();

	return json({
		authenticated: !!(credentials?.organizationId),
		organizationId: credentials?.organizationId ?? null,
		user: credentials?.user ?? null
	});
};
