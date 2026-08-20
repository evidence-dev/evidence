import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectSignature } from '$lib/markdown/files.server';
import { getProjectCwd } from '$lib/server/project-cwd';

// Baseline on globalThis so it survives an HMR re-eval of this module (first call baselines).
const store = globalThis as typeof globalThis & { __evdProjectSignature?: string };

export const GET: RequestHandler = async () => {
	try {
		const signature = await getProjectSignature(getProjectCwd());
		const changed =
			store.__evdProjectSignature !== undefined && signature !== store.__evdProjectSignature;
		store.__evdProjectSignature = signature;
		return json({ changed });
	} catch {
		return json({ changed: false });
	}
};
