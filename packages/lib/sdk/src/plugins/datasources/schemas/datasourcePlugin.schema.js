import { z } from 'zod';
import { DatasourceOptionSpecSchema } from './datasourcePluginOptions.schema.js';
import { QueryRunnerSchema } from './results.schema.js';

const BaseDatasourceSchema = z.object({
	options: DatasourceOptionSpecSchema,
	testConnection: z
		.function()
		.args(
			z.any({ description: 'Connection Options' }),
			z.string({ description: 'Datasource directory' })
		)
		.returns(z.promise(z.union([z.literal(true), z.object({ reason: z.string() })])))
});

const SimpleDatasourceSchema = BaseDatasourceSchema.extend({
	// getRunner
	getRunner: z
		.function()
		.args(
			z.any({ description: 'Connection Options' }),
			z.string({ description: 'Datasource directory' })
		)
		.returns(z.promise(QueryRunnerSchema))
});

const AdvancedDatasourceSchema = BaseDatasourceSchema.extend({
	// processSource
	processSource: z.function().returns(
		z.custom((d) => d && typeof d === 'object' && Symbol.asyncIterator in d, {
			message: 'Expected AsyncIterator result'
		})
	)
});

/** @typedef {z.infer<typeof DatasourceSchema>} Datasource */
export const DatasourceSchema = AdvancedDatasourceSchema.or(SimpleDatasourceSchema);
