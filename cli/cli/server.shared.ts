/**
 * Helpers shared between the production server (server.ts) and the
 * dev-mode server (server.dev.ts).
 */

import { exec } from 'child_process';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

export async function checkStudioServer(): Promise<boolean> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(`${STUDIO_HOST}/health`, {
			method: 'GET',
			signal: controller.signal
		});

		clearTimeout(timeoutId);
		return response.ok;
	} catch {
		return false;
	}
}

export async function ensureStudioServerOrExit(): Promise<void> {
	const studioRunning = await checkStudioServer();

	if (!studioRunning) {
		console.error(`  ✗ Evidence Studio server is not running at ${STUDIO_HOST}`);
		console.error('');
		console.error('    To start the Studio dev server:');
		console.error('      cd studio && pnpm run dev');
		console.error('');
		console.error('    Or set PUBLIC_STUDIO_HOST if running elsewhere:');
		console.error('      PUBLIC_STUDIO_HOST=https://your-studio.com evidence dev');
		console.error('');
		process.exit(1);
	}
}

export function openBrowser(url: string): void {
	const platform = process.platform;

	let command: string;
	if (platform === 'darwin') {
		command = `open "${url}"`;
	} else if (platform === 'win32') {
		command = `start "${url}"`;
	} else {
		command = `xdg-open "${url}"`;
	}

	exec(command, () => {
		// Silently fail if browser can't open
	});
}
