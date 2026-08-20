import type { Simplify } from 'type-fest';
import type { UserComponentSchema } from './types';

type AttributesWithDefaults<Schema extends UserComponentSchema> = Simplify<{
	[K in keyof Schema['attributes']]: undefined extends Schema['attributes'][K]['default']
		? never
		: Schema['attributes'][K]['default'];
}>;

/**
 * Builds an object containing attributes with default values from a UserComponentSchema.
 * This is necessary to use when we are rendering a user component and don't with to manually specify the defaults. Use this function
 * to gather the default values from the schema to prevent repition and maintain the schema as a single source of truth.
 *
 * @param schema A UserComponentSchema
 * @returns An object with keys for each attribute that has a default value, and the default value as the value
 */
export const getAttributeDefaults = <Schema extends UserComponentSchema>(
	schema: Schema
): AttributesWithDefaults<Schema> => {
	const defaults: Record<string, unknown> = {};
	for (const [key, attr] of Object.entries(schema.attributes)) {
		if (typeof attr.default !== 'undefined') {
			defaults[key] = attr.default;
		}
	}
	return defaults as AttributesWithDefaults<Schema>;
};
