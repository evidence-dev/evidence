import { parseArgs } from '@brianmd/citty';
import { sources } from './cli/sources.js';
import { rootCli } from '../../cli.root.js';
import { resolveMaybePromise } from '../../usql/utilities/resolveMaybePromise.js';

/**
 * This function is provided to create a compatibility layer between the legacy Evidence CLI and the new SDK CLI
 * @param  {...string} args
 * @returns {Promise<void>}
 */
export const sourcesCli = async (...args) => {
	const mainArgSpec =
		typeof rootCli.args === 'function' ? await rootCli.args() : await rootCli.args;
	const argSpec = typeof sources.args === 'function' ? await sources.args() : await sources.args;
	if (!argSpec) throw new Error();
	const parsed = parseArgs(args, { ...mainArgSpec, ...argSpec });
	// TODO: Include cli.setup and cli.catch here
	const context = { args: parsed, rawArgs: args, cmd: sources };
	// @ts-expect-error Types are actually correct, but not sure how to express that here
	await rootCli.setup?.(context);
	await resolveMaybePromise(
		() => {},
		() => sources.run?.(context),
		async (e) => {
			// @ts-expect-error Types are actually correct, but not sure how to express that here
			await rootCli.catch?.(context, e);
		}
	);
};
