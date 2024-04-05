import { PrerenderCache } from '@evidence-dev/universal-sql';

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
export const handleError = (e) => transformError(e.error);

/** @type {import("@sveltejs/kit").Handle} */
export async function handle({ event, resolve }) {
	globalThis.EvidenceCache = PrerenderCache;
	const req = await resolve(event);
	await EvidenceCache.persist();
	return req;
}
