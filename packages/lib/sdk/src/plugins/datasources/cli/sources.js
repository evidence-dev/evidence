import chalk from 'chalk';
import { dataDirectory, metaDirectory } from '../../../lib/projectPaths.js';
import { evalSources } from '../evalSources.js';
import { updateManifest } from '../updateManifest.js';

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
		}
	},

	async run({ args }) {
		const sources = new Set(
			args.sources
				?.toString()
				.split(',')
				.map(/** @param {string} s */ (s) => s.trim())
		);
		if (sources.size) console.debug(`\tRunning sources: ${[...sources].join(', ')}`);

		const queries = new Set(
			args.queries
				?.toString()
				.split(',')
				.map(/** @param {string} s */ (s) => s.trim())
		);
		if (queries.size) console.debug(`\tRunning queries: ${[...queries].join(', ')}`);

		const evaluatedManifest = await evalSources(dataDirectory, metaDirectory, {
			sources,
			queries,
			only_changed: args.changed === true
		});

		console.log('  Evaluated sources, saving manifest');

		await updateManifest(evaluatedManifest, dataDirectory);
		console.log(chalk.bold.green('  ✅ Done!'));
	}
};
