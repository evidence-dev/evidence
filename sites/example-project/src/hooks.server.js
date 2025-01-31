import { dev } from '$app/environment';
import { log } from '@evidence-dev/sdk/logger';

/** @param {Error | unknown} e  */
const transformError = (e) => {
	if (!(e instanceof Error)) {
		return JSON.parse(JSON.stringify(e));
	} else {
		return {
			message: e.message,
			stack: e.stack,
			name: e.name,
			cause: e.cause ? transformError(e.cause) : undefined
		};
	}
};

/** @type {import("@sveltejs/kit").HandleClientError } */
export const handleError = (e) => {
	log.error(`${e.message} | ${e.event.route.id ?? ''}`, {
		url: e.event.url.href,
		status: e.status
	});
	log.debug(e);
	return transformError(e.error);
};

/** @type {import('@sveltejs/kit').Handle} */
export function handle({ event, resolve }) {
	const loading = dev
		? `
	setTimeout(() => {
		const splash = document.getElementById('__evidence_project_splash');
		if (splash) {
			splash.style.visibility = 'visible';
		}
	}, 250);`
		: '';

	return resolve(event, { transformPageChunk: ({ html }) => html.replace('/*loading*/', loading) });
}
