import type { Handle } from '@sveltejs/kit';
import { isServeMode, basicAuthConfigured } from '$lib/server/serve-mode';
import { checkBasicAuth, SERVE_HARDENED_HEADERS } from '$cli/basic-auth';

// Routes that only exist for Studio auth or dev reload — neither can occur in
// serve mode (serve requires connection.yaml and ships immutable content).
const SERVE_DISABLED_PATHS = [
	'/login',
	'/api/auth/status',
	'/api/logout',
	'/api/switch-org',
	'/api/project-changed'
];

// Serve-mode perimeter: basic auth gate + hardened headers. All traffic —
// static assets, SSR pages, and the /api/query SQL relay — flows through
// hooks, so this is the single choke point.
export const handle: Handle = async ({ event, resolve }) => {
	if (isServeMode()) {
		const path = event.url.pathname;
		if (SERVE_DISABLED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
			return new Response('Not Found', { status: 404 });
		}

		if (basicAuthConfigured() && !checkBasicAuth(event.request.headers.get('authorization'))) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="evidence"' }
			});
		}

		const response = await resolve(event);
		for (const [k, v] of Object.entries(SERVE_HARDENED_HEADERS)) {
			response.headers.set(k, v);
		}
		return response;
	}

	return resolve(event);
};
