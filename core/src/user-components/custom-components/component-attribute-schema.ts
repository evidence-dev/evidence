import { z } from 'zod';
import {
	ATTRIBUTE_TYPES,
	CUSTOM_COMPONENT_ATTRIBUTE_TYPES,
	type CustomComponentAttributeType
} from './attribute-types';

export { ATTRIBUTE_TYPES, CUSTOM_COMPONENT_ATTRIBUTE_TYPES };
export type { CustomComponentAttributeType };

/**
 * The ONE way to declare an attribute in a component's frontmatter:
 *
 *   attributes:
 *     data:
 *       type: query
 *     value:
 *       type: column
 *       default: total
 *
 * Every field except `type` is optional. There is deliberately NO shorthand
 * (`data: query`) — one syntax keeps the docs, error messages, and AI
 * guidance unambiguous, and the shorthand invited the `value: total` mistake
 * (declaring a nonsense TYPE when the author meant a default).
 */
const attributeDeclarationSchema = z.object({
	type: z
		.enum(CUSTOM_COMPONENT_ATTRIBUTE_TYPES as [string, ...string[]])
		.describe('The attribute type — drives call-site autocomplete and validation.'),
	required: z.boolean().optional().describe('Call sites missing this attribute get an error.'),
	default: z.unknown().optional().describe('Used when the call site omits the attribute.'),
	description: z.string().optional().describe('Shown in call-site autocomplete.'),
	/**
	 * Restricts the attribute's value to one of a fixed set of strings.
	 * Maps to Markdoc's `matches` — the editor surfaces these as
	 * autocomplete on the attribute value, and the validator rejects
	 * call-site values outside the set. String-only today (the most
	 * common case); we can widen to number / boolean if anyone hits the
	 * limitation. Empty / undefined → unrestricted.
	 */
	options: z.array(z.string()).optional().describe('Restrict the value to a fixed set of strings.')
});

export const customComponentAttributesSchema = z.record(attributeDeclarationSchema);

/**
 * Frontmatter shape of a components/*.md file. Drives the editor's
 * schema-backed YAML autocomplete (key suggestions, `type:` enum values,
 * hover docs); validation stays with `parseCustomComponentAttributesWithErrors`,
 * which reports per-line teaching errors this schema can't express.
 */
export const customComponentFrontmatterSchema = z.object({
	type: z.literal('component').describe('Marks this file as a custom component.'),
	description: z
		.string()
		.optional()
		.describe('One-line summary shown in tag autocomplete and generated docs.'),
	attributes: customComponentAttributesSchema
		.optional()
		.describe('Typed attributes for the component — each key is an attribute name.'),
	preview: z
		.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
		.optional()
		.describe(
			'Authoring-only fixture values, keyed by attribute name. Used ONLY when this file is rendered standalone (editing preview) — never at call sites. Give every attribute the SQL consumes a preview (or a default) so the query preview can run.'
		)
});

/**
 * Completion-only variant: the declaration's `type` becomes a union of
 * described literals so the editor shows each type's registry description
 * next to its suggestion. Validation keeps the plain z.enum above — a union
 * would degrade its "expected one of …" error message.
 */
const describedTypeLiterals = CUSTOM_COMPONENT_ATTRIBUTE_TYPES.map((t) =>
	z.literal(t).describe(ATTRIBUTE_TYPES[t].description)
) as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]];

export const customComponentFrontmatterCompletionSchema = customComponentFrontmatterSchema.extend({
	attributes: z
		.record(
			attributeDeclarationSchema.extend({
				type: z
					.union(describedTypeLiterals)
					.describe('The attribute type — drives call-site autocomplete and validation.')
			})
		)
		.optional()
		.describe('Typed attributes for the component — each key is an attribute name.')
});

export type CustomComponentAttributeDeclaration = {
	type: CustomComponentAttributeType;
	required: boolean;
	default: unknown;
	description?: string;
	options?: readonly string[];
};

/**
 * Normalise the raw `attributes:` frontmatter map, parsing each entry
 * INDIVIDUALLY so one malformed declaration (unknown type, wrong shape)
 * doesn't erase the valid ones. A whole-block `safeParse` would fail the
 * entire record on a single bad entry — the author would silently lose
 * autocomplete and defaults for every attribute with no clue why. Instead we
 * keep every good entry and report the bad ones via `errors` so the call site
 * can surface them as an editor squiggle.
 */
export function parseCustomComponentAttributesWithErrors(raw: unknown): {
	attributes: Record<string, CustomComponentAttributeDeclaration>;
	/** One entry per bad declaration; `name` lets callers locate the offending frontmatter line. */
	errors: { name: string; message: string }[];
} {
	if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
		return { attributes: {}, errors: [] };
	}

	const attributes: Record<string, CustomComponentAttributeDeclaration> = {};
	const errors: { name: string; message: string }[] = [];

	for (const [name, rawValue] of Object.entries(raw as Record<string, unknown>)) {
		const parsed = attributeDeclarationSchema.safeParse(rawValue);
		if (!parsed.success) {
			// A string value is either an attempted type shorthand (`data: query`
			// — no longer supported) or an intended default (`value: total`).
			// Both get the same fix: the `type:` block form. Suggest the string
			// as the type when it IS one, as the default when it isn't.
			const isTypeName =
				typeof rawValue === 'string' &&
				(CUSTOM_COMPONENT_ATTRIBUTE_TYPES as readonly string[]).includes(rawValue);
			errors.push({
				name,
				message:
					typeof rawValue === 'string'
						? isTypeName
							? `Attribute "${name}": declare the type with a \`type:\` field:\n${name}:\n  type: ${rawValue}`
							: `Attribute "${name}": "${rawValue}" is not a valid declaration. Declare a type (one of: ${CUSTOM_COMPONENT_ATTRIBUTE_TYPES.join(', ')}); to set a default value:\n${name}:\n  type: column\n  default: ${rawValue}`
						: `Attribute "${name}" is invalid. Declare it with a \`type:\` field (one of: ${CUSTOM_COMPONENT_ATTRIBUTE_TYPES.join(', ')}).`
			});
			continue;
		}

		const value = parsed.data;
		attributes[name] = {
			type: value.type as CustomComponentAttributeType,
			required: value.required ?? false,
			default: value.default,
			description: value.description,
			options: value.options
		};
	}

	return { attributes, errors };
}

/**
 * Convenience wrapper for call sites that only need the parsed attributes and
 * not the per-entry error list (autocomplete catalogues, the declared-variable
 * derivation). Bad entries drop out; use `…WithErrors` when you want to surface
 * them.
 */
export function parseCustomComponentAttributes(
	raw: unknown
): Record<string, CustomComponentAttributeDeclaration> {
	return parseCustomComponentAttributesWithErrors(raw).attributes;
}
