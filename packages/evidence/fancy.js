import { updateDatasourceOutputs } from '@evidence-dev/plugin-connector';
/**
 *
 * @param {import("sade").Sade} prog
 */
export const addFancy = (prog) => {
	prog
		.command('build:sources')
		.describe('creates .parquet files from source queries')
		.option('--changed', 'only build sources whose queries have changed')
		.option('--sources', 'only build queries from the specified source directories')
		.option('--queries', 'only build the specified queries')
		.option('--debug', 'show debug output')
		.example('npx evidence build:sources --changed')
		.example('npx evidence build:sources --sources needful_things --queries orders,reviews')
		.example('npx evidence build:sources --queries needful_things.orders,needful_things.reviews')
		.example('npx evidence build:sources --sources needful_things,social_media')
		.action(async (opts) => {
			// TODO: Need a debug flag of some sort
			if (!opts.debug)
				process.on('uncaughtException', (e) => {
					console.error(e.message);
					process.exit(1);
				});
			const sources = opts.sources?.split(',') ?? null;
			const queries = opts.queries?.split(',') ?? null;
			await updateDatasourceOutputs(
				'./.evidence/template/static/data',
				'./.evidence/template/.evidence-queries',
				{
					sources: sources ? new Set(sources) : sources,
					queries: queries ? new Set(queries) : queries,
					only_changed: opts.changed
				}
			);
		});
};
