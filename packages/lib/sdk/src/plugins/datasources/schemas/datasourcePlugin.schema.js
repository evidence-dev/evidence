import { z } from 'zod';
import { DatasourceOptionSpecSchema } from './datasourcePluginOptions.schema.js';
import { QueryRunnerSchema } from './results.schema.js';
import path from 'node:path';

const absolutePath = z.string().refine((input) => path.isAbsolute(input));

const BaseDatasourceSchema = z.object({
	options: DatasourceOptionSpecSchema,
	testConnection: z
		.function()
		.args(
			z.any({ description: 'Connection Options' }),
			z.string({ description: 'Datasource directory' })
		)
		.returns(z.promise(z.union([z.literal(true), z.object({ reason: z.string() })]))),

	createSourceTable: z
		.function()
		.args(
			z.string({
				description: 'New Source Name'
			}),
			z.string({
				description: 'Source root directory'
			})
		)
		.returns(z.promise(absolutePath).or(absolutePath))
		// Zod's default accepts a function to generate a default value, so we return a function from that function
		.default(() => () => {
			throw new Error('createSourceTable not implemented');
		})
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
