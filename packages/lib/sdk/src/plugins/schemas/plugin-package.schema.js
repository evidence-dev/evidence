import { z } from 'zod';
import * as evidenceIcons from '@evidence-dev/icons';
import * as simpler from '@steeze-ui/simple-icons';
import * as tabler from '@steeze-ui/tabler-icons';
import { copyMethods } from '../layouts/copyMethods/index.js';
import path from 'path';

const iconKeys = /** @type {[string, ...string[]]} */ ([
	...Object.keys(simpler),
	...Object.keys(tabler),
	...Object.keys(evidenceIcons)
]);

/*
	Each type of plugin is defined as a schema of what it expects in the .evidence field

	They are then exported as types and a single merged schema with helper narrowing functions

	e.g.

	// ...load package
	const validPluginPackage = PluginPackageSchema.parse(packageContnt)
	// We now know that it is a valid plugin; but we can further narrow to what kind

	if (isLayoutPlugin(validPluginPackage)) {
		// it is a layout plugin
		if (isDatasourcePlugin(validPluginPackage)) {
			// it is a layout plugin AND a datasource plugin
		}
	}
	if (isComponentPlugin) {
		// it may or may not be a layout or datasource plugin, but it is a component plugin
	}
*/

const BasePluginPackageSchema = z.object({
	name: z.string(),
	version: z.string(),
	evidence: z.object({})
});

const LayoutPluginSchema = BasePluginPackageSchema.extend({
	evidence: z.object({
		layout: z.object({
			routes: z.object({
				destination: z
					.string({ description: 'Determines where files will be placed into the template' })
					.default(path.join('src', 'routes')),
				style: z.enum(/** @type {[string, ...string[]]} */ (Object.keys(copyMethods)), {
					description: 'Determines how filenames will be transformed into the template'
				})
			}),
			components: z
				.object({
					destination: z.string().default(path.join('src', 'components'))
				})
				.default({}),
			static: z
				.object({
					destination: z.string().default(path.join('static'))
				})
				.default({}),
			root: z.string().optional()
		})
	})
});

const DatasourcePluginSchema = BasePluginPackageSchema.extend({
	evidence: z.object({
		datasources: z.array(
			z.union([
				z.string({ description: 'Name of a supported database, this value is used in the UI' }),
				z.array(z.string(), {
					description:
						'Group of names that are aliases of the same database. First value is used in UI'
				})
			]),
			{
				description: 'List of database names that this plugin supports'
			}
		),
		icon: z
			.enum(iconKeys, {
				errorMap: (e) => {
					if (e.code === 'invalid_enum_value')
						return {
							message:
								"'An invalid icon name was provided, only simple-icons and tabler-icons are valid'"
						};
					return {
						...e,
						message: e.message ?? ''
					};
				}
			})
			.optional()
	}),
	main: z.string()
});

const ComponentPluginSchema = BasePluginPackageSchema.extend({
	evidence: z.object({
		components: z
			.boolean()
			.or(z.string({ description: 'Relative path to the file exporting components' })) // This is not default-false because the key may not exist, and we want to preserve that behavior
	}),
	main: z.string()
});

/** @typedef {z.infer<typeof LayoutPluginSchema>} LayoutPackage */
/** @typedef {z.infer<typeof DatasourcePluginSchema>} DatasourcePackage */
/** @typedef {z.infer<typeof ComponentPluginSchema>} ComponentPackage */

/** @typedef {z.infer<typeof PluginPackageSchema>} PluginPackage */
export const PluginPackageSchema = BasePluginPackageSchema
	// Merge fields that are not in 'evidence' (e.g. main)
	.merge(LayoutPluginSchema.partial())
	.merge(DatasourcePluginSchema.partial())
	.merge(ComponentPluginSchema.partial())
	.extend({
		// Merge 'evidence' fields (this just get overwritten above)
		evidence: LayoutPluginSchema.shape.evidence
			.merge(DatasourcePluginSchema.shape.evidence)
			.merge(ComponentPluginSchema.shape.evidence)
			.partial()
	});

/**
 * Type refinement function to check if a package is a layout plugin
 * @param {PluginPackage} v
 * @returns {v is LayoutPackage}
 */
export const isLayoutPlugin = (v) => {
	const result = LayoutPluginSchema.safeParse(v);
	return result.success;
};
/**
 * Type refinement function to check if a package is a datasource plugin
 * @param {PluginPackage} v
 * @returns {v is DatasourcePackage}
 */
export const isDatasourcePlugin = (v) => {
	const result = DatasourcePluginSchema.safeParse(v);
	return result.success;
};
/**
 * Type refinement function to check if a package is a datasource plugin
 * @param {PluginPackage} v
 * @returns {v is ComponentPackage}
 */
export const isComponentPlugin = (v) => {
	const result = ComponentPluginSchema.safeParse(v);
	return result.success;
};
