import { z } from 'zod';

/** @typedef {z.infer<typeof PluginConfigSchema>} PluginConfig */
export const PluginConfigSchema = z.object({
	components: z
		.record(
			z.string(),
			z.object({
				overrides: z
					.array(z.string(), { description: 'Components that will always come from this package.' })
					.default([]),
				aliases: z
					.record(
						z.string({ description: 'Component Name' }),
						z.string({ description: 'Alias to apply' })
					)
					.default({}),

				provides: z
					.array(z.string(), {
						description:
							'Manual list of components exported by this plugin, will override any internal plugin configuration'
					})
					.default([])
			})
		)
		.optional(),
	datasources: z
		.record(
			z.string(),
			z.object({
				overrides: z
					.array(z.string(), {
						description:
							'The specified datasources will always use this plugin. Can only be specified once per source type'
					})
					.optional()
			})
		)
		.optional()
});
