import { findFile } from 'pkg-types';
import fs from 'fs/promises';
import { log } from '@clack/prompts';

const defaultContent = `
import { ssrHook } from '$evidence/ssrHook.svelte.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    /** @type {{ name: string, queryString: string}[]} */
    const presentQueries = []
    const response = await resolve(event, {
        transformPageChunk: ssrHook(presentQueries)
    });
    return response;
}
`;

export const addServerHook = async () => {
	const hooks = await findFile('./src/hooks.server.js')
		.catch(() => findFile('./src/hooks.server.ts'))
		.catch(() => false);
	if (hooks) {
		log.warn(
			'Server hooks file already exists. Please see the wiki for information on configuring SSR. https://github.com/evidence-dev/sdk/wiki/Configuring-SSR'
		);
	} else {
		await fs.writeFile('./src/hooks.server.js', defaultContent);
	}
};
