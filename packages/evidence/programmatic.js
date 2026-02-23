import { cli } from '@evidence-dev/sdk/legacy-compat';

const restoreEnv = (originalEnv) => {
	for (const key of Object.keys(process.env)) {
		if (!(key in originalEnv)) delete process.env[key];
	}
	Object.assign(process.env, originalEnv);
};

/**
 * Run an Evidence CLI command in-process without spawning a long-running server by default.
 * @param {string[]} args
 * @param {{cwd?: string, env?: Record<string, string>}} [options]
 * @returns {Promise<void>}
 */
export const runEvidence = async (args = [], options = {}) => {
	const originalArgv = process.argv;
	const originalCwd = process.cwd();
	const originalEnv = { ...process.env };

	try {
		if (options.cwd) process.chdir(options.cwd);
		if (options.env) Object.assign(process.env, options.env);
		process.argv = ['node', 'evidence', ...args];
		await cli();
	} finally {
		process.argv = originalArgv;
		restoreEnv(originalEnv);
		if (process.cwd() !== originalCwd) process.chdir(originalCwd);
	}
};

const addFlag = (args, name, value) => {
	if (value === undefined || value === false || value === null) return;
	args.push(`--${name}`);
	if (value !== true) args.push(String(value));
};

/**
 * Build an Evidence project to static output.
 * @param {{strict?: boolean, debug?: boolean, cwd?: string, env?: Record<string, string>}} [options]
 * @returns {Promise<void>}
 */
export const buildEvidence = async (options = {}) => {
	const args = [options.strict ? 'build:strict' : 'build'];
	addFlag(args, 'debug', options.debug);
	await runEvidence(args, options);
};

/**
 * Evaluate and materialize Evidence source queries.
 * @param {{changed?: boolean, sources?: string | string[], queries?: string | string[], strict?: boolean, debug?: boolean, cwd?: string, env?: Record<string, string>}} [options]
 * @returns {Promise<void>}
 */
export const sourcesEvidence = async (options = {}) => {
	const args = ['sources'];
	addFlag(args, 'changed', options.changed);
	addFlag(args, 'strict', options.strict);
	addFlag(args, 'debug', options.debug);

	const sources = Array.isArray(options.sources) ? options.sources.join(',') : options.sources;
	const queries = Array.isArray(options.queries) ? options.queries.join(',') : options.queries;
	addFlag(args, 'sources', sources);
	addFlag(args, 'queries', queries);

	await runEvidence(args, options);
};
