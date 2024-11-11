import fs from 'fs';
import path from 'path';

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = ({ url }) => {
	console.log('fix-tprotocol-service-worker GET', url.pathname);
	if (url.pathname.endsWith('fix-tprotocol-service-worker.js')) {
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
	}
};
