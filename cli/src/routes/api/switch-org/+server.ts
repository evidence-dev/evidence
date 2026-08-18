/**
 * API endpoint to switch organizations.
 * Updates the stored org ID and gets a new sealed session for query engine auth.
 * The layout load function will fetch the fresh org name on reload.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadCredentials, saveCredentials } from '$lib/auth/credentials.server';
const PUBLIC_STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST ?? 'https://evidence.studio';

const STUDIO_HOST = PUBLIC_STUDIO_HOST.replace(/\/$/, '');

export const POST: RequestHandler = async ({ request }) => {
	const { organizationId } = await request.json();

	if (!organizationId || typeof organizationId !== 'string') {
		return json({ error: 'Organization ID required' }, { status: 400 });
	}

	const credentials = await loadCredentials();
	if (!credentials) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Update org ID
	credentials.organizationId = organizationId;

	// Get new sealed session for the target org (needed for query engine auth)
	try {
		const sessionResponse = await fetch(`${STUDIO_HOST}/api/cli/session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: credentials.refreshToken,
				organizationId
			})
		});

		if (sessionResponse.ok) {
			const sessionData = await sessionResponse.json();
			credentials.sealedSession = sessionData.sealedSession;
		}
	} catch {
		// Sealed session update failed -- queries may not work but org switch still proceeds
	}

	await saveCredentials(credentials);

	return json({ success: true });
};
