import { buildDevCli } from './build-dev/cli/index.js';
import { config } from './configuration/cli/index.js';

import { cmdFail } from './lib/cli/cmdFail.js';
import { enableDebug } from './lib/debug.js';
import { datasourcesCli } from './plugins/datasources/cli/index.js';
import { pluginsCli } from './plugins/cli/index.js';
import { defineCommand } from '@brianmd/citty';
import { writeFile, mkdir } from 'node:fs/promises';

// This is split into it's own file so that we can import it elsewhere without running the CLI twice

export const rootCli = defineCommand({
	meta: {
		name: 'evidence',
		description: 'CLI to make interacting with Evidence projects easier'
	},

	args: {
		debug: {
			type: 'boolean',
			default: false,
			description: 'Enable additional debug logging'
		},
		profile: {
			type: 'boolean',
			default: false,
			description: 'Enable profiling'
		}
	},

	async setup(ctx) {
		process.on('uncaughtException', (e) => {
			cmdFail(e);
		});
		process.on('unhandledRejection', (e) => {
			if (e instanceof Error) cmdFail(e);
			else cmdFail(new Error('Unhandled Promise Rejection', { cause: e }));
		});

		if (ctx.args.debug) enableDebug();
		else {
			const debug = console.debug;
			/* Disable console.debug */
			console.debug = () => {};
			// TODO: Check on this, it seems to leak debug once the dev server has started
			/* Restore console.debug in a wrapped cleanup function */
			const cleanup = this.cleanup;
			this.cleanup = async (_ctx) => {
				await cleanup?.(_ctx);
				console.debug = debug;
			};
		}

		if (ctx.args.profile) {
			const { Session } = await import('node:inspector/promises');
			const session = new Session();
			session.connect();
			await session.post('Profiler.enable');
			await session.post('Profiler.start');

			const cleanup = this.cleanup;
			this.cleanup = async (_ctx) => {
				const { resolve, dirname } = await import('node:path');

				const path = resolve(`./.evidence/template/profiles/${ctx.args._.join('-')}.cpuprofile`);
				await mkdir(dirname(path), { recursive: true });
				const { profile } = await session.post('Profiler.stop');
				await writeFile(path, JSON.stringify(profile));

				await session.post('Profiler.disable');
				session.disconnect();

				await cleanup?.(_ctx);
			};
		}
	},

	catch(ctx, e) {
		cmdFail(e);
	},

	subCommands: {
		...buildDevCli,
		...datasourcesCli,
		...pluginsCli,

		config
	}
});
