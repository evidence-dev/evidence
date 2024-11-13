import fs from 'fs';
import path from 'path';

export const prerender = true;

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = () => {
	const swPath = path.join(process.cwd(), 'src', 'fix-tprotocol-service-worker.js');
	let content = fs.readFileSync(swPath, 'utf-8');

	if (import.meta.env.VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER === 'true') {
		content = content.replace('const disabled = false;', `const disabled = true;`);
	}

	return new Response(content, {
		headers: {
			'Content-Type': 'application/javascript'
		}
	});
};
