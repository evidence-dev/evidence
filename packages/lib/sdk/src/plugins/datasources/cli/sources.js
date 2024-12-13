import chalk from 'chalk';
import { dataDirectory, metaDirectory } from '../../../lib/projectPaths.js';
import { evalSources } from '../evalSources.js';
import { updateManifest } from '../updateManifest.js';
import { log } from '../../../logger/index.js';
import { enableStrictMode, isStrictMode } from '../../../lib/strict.js';
import { EvidenceError } from '../../../lib/EvidenceError.js';

/** @type { import("@brianmd/citty").CommandDef } */
export const sources = {
	meta: {
		name: 'sources',
		description: 'Update your Evidence source outputs'
	},

	args: {
		changed: {
			type: 'boolean',
			description: 'Run only queries that have changed',
			default: false
		},
		sources: {
			type: 'string',
			description: "Run only the listed sources (',' delimited)"
		},
		queries: {
			type: 'string',
			description: "Run only the listed queries (',' delimited)"
		},
		strict: {
			type: "boolean",
			description: "Fail when a source query fails",
			default: false
		}
	},

	async run({ args }) {
		
		if (args.strict) {
			enableStrictMode()
			if (!isStrictMode()) {
				throw new EvidenceError("Failed to enable strict mode")
			}
		}

		const sources = new Set(
			args.sources
				?.toString()
				.split(',')
				.map(/** @param {string} s */ (s) => s.trim())
		);
		if (sources.size) log.debug(`\tRunning sources: ${[...sources].join(', ')}`);

		const queries = new Set(
			args.queries
				?.toString()
				.split(',')
				.map(/** @param {string} s */ (s) => s.trim())
		);
		if (queries.size) log.debug(`\tRunning queries: ${[...queries].join(', ')}`);

		const evaluatedManifest = await evalSources(dataDirectory, metaDirectory, {
			sources,
			queries,
			only_changed: args.changed === true
		}, isStrictMode());

		log.info('  Evaluated sources, saving manifest');

		await updateManifest(evaluatedManifest, dataDirectory);
		log.info(chalk.bold.green('  ✅ Done!'));
	}
};
