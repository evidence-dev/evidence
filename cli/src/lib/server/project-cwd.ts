/**
 * Resolve the user's project directory.
 *
 * In production (the compiled binary), this is just `process.cwd()`. During
 * `pnpm cli:dev` the CLI spawns vite with cwd set to the cli package so vite
 * can find its config; the user's project is forwarded via EVIDENCE_PROJECT_CWD.
 */
export function getProjectCwd(): string {
	return globalThis.process.env.EVIDENCE_PROJECT_CWD || globalThis.process.cwd();
}
