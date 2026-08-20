/**
 * Serve mode (`evidence serve`) is set by the CLI entrypoint via EVIDENCE_SERVE
 * before the embedded SvelteKit app boots. Routes/hooks read it to strip dev
 * machinery and disable the Studio-login surface.
 */
export function isServeMode(): boolean {
	return !!process.env.EVIDENCE_SERVE;
}

export function basicAuthConfigured(): boolean {
	return !!(process.env.EVIDENCE_BASIC_USER && process.env.EVIDENCE_BASIC_PASSWORD);
}
