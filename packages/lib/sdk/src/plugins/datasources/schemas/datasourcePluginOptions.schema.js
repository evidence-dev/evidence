import { z } from 'zod';
/** @typedef {string|number|boolean} Primitive */

/**
 * @typedef {Object} IDatasourceOptionSpec
 * @property {string} title
 * @property {'string' | 'multiline' | 'number' | 'boolean' | 'select' | 'file'} type
 * @property {boolean} [secret]
 * @property {boolean} [shown]
 * @property {string} [description]
 * @property {boolean} [virtual]
 * @property {string} [references]
 * @property {boolean} [forceReference]
 * @property {'json' | 'yaml'} [fileFormat]
 * @property {boolean} [nest]
 * @property {string | number | boolean | undefined} [default]
 * @property {Record<string | number | symbol, Record<string, IDatasourceOptionSpec>> | undefined} [children]
 * @property {Array<string | { value: Primitive, label: string}>} [options]
 * @property {boolean} [required]
 */

const primitive = z.union([z.string(), z.number(), z.boolean()]);

/** @type {z.ZodRecord<z.ZodType<string>, z.ZodType<IDatasourceOptionSpec>>} */
export const DatasourceOptionSpecSchema = z.record(
	z.string(),
	z.object({
		title: z.string({ description: 'Title of the option (UI)' }),
		type: z.enum(['string', 'multiline', 'number', 'boolean', 'select', 'file'], {
			description: 'Control type to show'
		}),
		secret: z.boolean({ description: 'If true, will not be source controlled' }).default(false),
		shown: z
			.boolean({ description: 'Only used for secret values, overrides hiding them by default' })
			.optional(),
		/**
		 * Indicates that the field should not actually be persisted. Should be combined with `references`
		 */
		virtual: z
			.boolean({
				description:
					'Indicates that the field is only for form logic, should be combined with references'
			})
			.default(false),
		/**
		 * Indicates that the field should get its value from another field if it is available
		 */
		references: z.string().optional(),
		/**
		 * Indicates that the field can only get its value from the references
		 */
		forceReference: z.boolean().default(false),
		fileFormat: z.enum(['json', 'yaml']).optional(),
		description: z.string().optional(),
		children: z.lazy(() => z.record(z.string(), DatasourceOptionSpecSchema)).optional(),
		required: z.boolean().default(false),
		options: z
			.union([z.string(), z.object({ value: primitive, label: z.string() })])
			.array()
			.optional(),
		nest: z.boolean().optional(),
		default: primitive.optional()
	})
);
