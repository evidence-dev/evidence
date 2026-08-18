/**
 * Logout endpoint - clears stored credentials
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearCredentials } from '$lib/auth/credentials.server';

export const POST: RequestHandler = async () => {
	await clearCredentials();
	return json({ success: true });
};
