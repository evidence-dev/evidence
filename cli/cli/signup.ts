import { openBrowser } from './auth.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

export async function signup(): Promise<void> {
	const url = `${STUDIO_HOST}/sign-up?cli=1`;
	console.log('');
	console.log('  Opening Evidence in your browser — create your account and workspace.');
	console.log('  When you are done, run `evidence login` to connect this CLI.');
	console.log(`\n    ${url}\n`);
	openBrowser(url);
	process.exit(0);
}
