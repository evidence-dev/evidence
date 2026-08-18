/**
 * Dev-mode entry for `evidence dev`.
 *
 * Runs the same Studio health check the binary path runs, then spawns
 * `vite dev` with the cli package as its cwd (so vite finds its config),
 * forwarding the user's project directory via EVIDENCE_PROJECT_CWD.
 *
 * Used when running from source (detected via `process.execPath`) — see
 * the `dev` case in `index.ts` and `pnpm evd dev`.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureStudioServerOrExit } from './server.shared.ts';

export interface DevServerOptions {
	port: number;
	open: boolean;
}

export async function startDevServer(options: DevServerOptions): Promise<void> {
	const { port, open } = options;

	await ensureStudioServerOrExit();

	const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

	// `run dev` rather than `exec vite dev`: the sandbox iframe runtimes are build
	// output that vite dev serves from static/ but never produces, and the `dev`
	// script chains that build. Without it every {% html %} / {% custom_echart %}
	// block renders blank in source-dev mode.
	const viteArgs = ['run', 'dev', '--port', String(port)];
	if (open) viteArgs.push('--open');

	const projectCwd = process.env.EVIDENCE_PROJECT_CWD ?? process.cwd();

	console.log(`  Starting vite dev (project: ${projectCwd})\n`);

	const child = spawn('pnpm', viteArgs, {
		cwd: cliRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			EVIDENCE_PROJECT_CWD: projectCwd
		}
	});

	const forwardSignal = (sig: NodeJS.Signals) => () => {
		if (!child.killed) child.kill(sig);
	};
	process.on('SIGINT', forwardSignal('SIGINT'));
	process.on('SIGTERM', forwardSignal('SIGTERM'));

	await new Promise<void>((resolve) => {
		child.on('error', (err) => {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === 'ENOENT') {
				console.error('  ✗ pnpm not found — ensure pnpm is installed and in your PATH.');
			} else {
				console.error(`  ✗ Failed to start vite dev: ${err.message}`);
			}
			process.exit(1);
		});
		child.on('exit', (code) => {
			process.exit(code ?? 0);
			resolve();
		});
	});
}
