import { building } from '$app/environment';
import { log } from '@evidence-dev/sdk/logger';
/** @param {Error | unknown} e  */
const transformError = (e) => {
	if (!(e instanceof Error)) {
		console.log(`Page threw a non-error`, { error: e });
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
	if (building) {
		log.die(
			`Evidence encountered an error while building your project:`,
			[
				`Page: ${e.event.route.id}`,
				`Message: ${e.error?.message ?? 'Unknown'}`,
				`Error Type: ${e.status === 404 ? 'Missing Page' : 'Build Error'}`
			],
			{ e, location: 'Client' }
		);
	}
	return transformError(e.error);
};
