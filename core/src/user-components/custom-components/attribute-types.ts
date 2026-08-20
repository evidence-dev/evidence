import type { UserComponentAttribute } from '../types';

/**
 * One definition per attribute "kind" a component author can declare in
 * their frontmatter. Every surface (Markdoc schema build, call-site
 * autocomplete, body `{{ varname.prop }}` autocomplete, frontmatter
 * hover-help, generated docs) reads from this single source — adding a
 * new attribute kind is one entry here, no other touchpoints.
 *
 * Three concerns are bundled into one definition because that's how the
 * type appears to the author: when they write `period: date_range` they
 * implicitly mean "this is a date-range-shaped attribute" which carries:
 *   1. the underlying value type (string preset OR `{start,end,label}` literal)
 *   2. the editor autocomplete on the call-site VALUE (preset dropdown)
 *   3. the documented property shape for `.start` / `.end` / `.label` in the body
 *
 * Splitting these into separate user-facing fields ("underlying: string;
 * input: date_range; body: {start,end,label}") would be more honest but
 * less ergonomic. The unified `type:` field is the right authoring shape
 * for v1; we can split later if a real case needs it.
 */
export type AttributeTypeDef = {
	/** Markdoc primitive the call-site value is parsed as. */
	underlying:
		| typeof String
		| typeof Number
		| typeof Boolean
		| typeof Object
		| typeof Array;
	/**
	 * Editor autocomplete shown on the call-site VALUE. Mirrors the
	 * `suggestionType` field on built-in component attribute schemas — see
	 * `studio/.../completionProvider.ts` for the per-suggestionType
	 * dropdown behaviors (table/column/format/date_range/comparison/filter
	 * all already have surfacing logic; the registry just opts in).
	 */
	suggestionType?:
		| 'table'
		| 'column'
		| 'dateColumn'
		| 'filter'
		| 'sql'
		| 'format'
		| 'date_range'
		| 'comparison'
		| 'match_by';
	/**
	 * Context for `{{ filterId.property }}` interpolation. Determines how
	 * Evidence's variable processor formats the substituted value at runtime
	 * (quoted for SQL WHERE clauses, raw for column expressions, etc.).
	 * Only relevant for types whose value is interpolated into SQL — string
	 * default ('text') is fine elsewhere.
	 */
	variableContext?: 'sql' | 'column' | 'text';
	/**
	 * Whether changes to this attribute should trigger the data-loader to
	 * re-run the page's queries. True for attributes that name a query or
	 * a column the query references — the renderer optimises by skipping
	 * re-runs when no `affectsQuery` attribute changed.
	 */
	affectsQuery?: boolean;
	/**
	 * Whether the call-site value supports filter-variable interpolation
	 * (`title="{{ dropdown1.selected }}"`). Most identifier-shaped types
	 * want this on so authors can wire a component to a filter.
	 */
	supportsVariables?: boolean;
	/**
	 * Properties accessible as `{{ varname.prop }}` in the component body.
	 * Read by the editor's variable autocomplete to suggest property names
	 * when the cursor is on `{{ <attrname>.` — same UX a page author gets
	 * when typing `{{ filterId.start }}`. Each entry feeds a single
	 * autocomplete item with `name` as the suggestion, `description` as
	 * hover-help, and `example` as an optional preview snippet.
	 *
	 * Empty / undefined for types whose value is a plain scalar (string,
	 * number, boolean, column, query, format, sql) — those resolve to a
	 * single value without sub-properties.
	 */
	bodyProperties?: ReadonlyArray<{
		name: string;
		description: string;
		example?: string;
	}>;
	/**
	 * Authoring-time description for the type itself. Surfaces in
	 * frontmatter hover-help (`type: date_range` → tooltip with this
	 * text) and in generated docs.
	 */
	description: string;
};

// Internal const-assertion so the KEYS are typed precisely (powers the
// `CustomComponentAttributeType` union below) without forcing every value
// into its exact literal type — which would lose the optional `?` fields
// on entries that don't set them. We re-export through a widened
// `Record<…, AttributeTypeDef>` so consumers can access optional fields
// (`suggestionType`, `bodyProperties`, …) without per-entry narrowing.
const ATTRIBUTE_TYPES_INTERNAL = {
	string: {
		underlying: String,
		supportsVariables: true,
		variableContext: 'text',
		description: 'A free-form text value.'
	},
	number: {
		underlying: Number,
		description: 'A numeric value.'
	},
	boolean: {
		underlying: Boolean,
		description: 'true or false.'
	},
	query: {
		underlying: String,
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text',
		description:
			'Name of a query or table in this project. Autocompletes from project queries; triggers data loading.'
	},
	column: {
		underlying: String,
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column',
		description:
			"Column name in the data attribute's table. Autocompletes from the table's columns."
	},
	format: {
		underlying: String,
		suggestionType: 'format',
		description: 'A format string ("usd", "pct1", etc.). Autocompletes from format presets.'
	},
	sql: {
		underlying: String,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'sql',
		description: 'A SQL fragment. Interpolated into queries with proper quoting.'
	},
	date_range: {
		underlying: String,
		suggestionType: 'date_range',
		supportsVariables: true,
		variableContext: 'text',
		description:
			'A time period — preset string ("Last 30 Days") or {start, end, label} object.',
		bodyProperties: [
			{
				name: 'start',
				description: 'ISO date of period start (YYYY-MM-DD).',
				example: '2024-01-01'
			},
			{
				name: 'end',
				description: 'ISO date of period end (YYYY-MM-DD).',
				example: '2024-01-31'
			},
			{
				name: 'label',
				description: 'Human-readable label.',
				example: 'Last 30 Days'
			}
		]
	},
	comparison: {
		underlying: String,
		suggestionType: 'comparison',
		supportsVariables: true,
		variableContext: 'text',
		description:
			'A comparison period for KPIs ("Previous Period", "Previous Year", etc.).',
		bodyProperties: [
			{
				name: 'start',
				description: 'ISO date of comparison period start.',
				example: '2023-12-01'
			},
			{
				name: 'end',
				description: 'ISO date of comparison period end.',
				example: '2023-12-31'
			},
			{
				name: 'label',
				description: 'Human-readable label.',
				example: 'Previous Period'
			}
		]
	},
	filter: {
		underlying: String,
		suggestionType: 'filter',
		supportsVariables: true,
		variableContext: 'text',
		description:
			'Reference to a filter ID (`{% dropdown id="..." /%}` etc.) on the calling page.',
		bodyProperties: [
			{
				name: 'selected',
				description: 'The selected value, quoted for SQL.',
				example: "'apparel'"
			},
			{
				name: 'literal',
				description: 'The selected value, unquoted (for text/display).',
				example: 'apparel'
			}
		]
	}
} as const;

export type CustomComponentAttributeType = keyof typeof ATTRIBUTE_TYPES_INTERNAL;

export const ATTRIBUTE_TYPES: Record<CustomComponentAttributeType, AttributeTypeDef> =
	ATTRIBUTE_TYPES_INTERNAL;

export const CUSTOM_COMPONENT_ATTRIBUTE_TYPES = Object.keys(
	ATTRIBUTE_TYPES_INTERNAL
) as readonly CustomComponentAttributeType[];

/**
 * Translate a registry entry plus the per-attribute author overrides
 * (required/default/description/options) into a Markdoc attribute schema
 * the editor + Markdoc parser both consume. Centralised here so adding a
 * new type or a new override field is one place.
 */
export function buildMarkdocAttribute(
	type: CustomComponentAttributeType,
	overrides: {
		required?: boolean;
		default?: unknown;
		description?: string;
		options?: readonly string[];
	}
): UserComponentAttribute {
	const def = ATTRIBUTE_TYPES[type];
	const attr: UserComponentAttribute = {
		type: def.underlying,
		required: overrides.required ?? false,
		default: overrides.default,
		description: overrides.description ?? def.description,
		...(def.suggestionType ? { suggestionType: def.suggestionType } : {}),
		...(def.affectsQuery ? { affectsQuery: def.affectsQuery } : {}),
		...(def.supportsVariables ? { supportsVariables: def.supportsVariables } : {}),
		...(def.variableContext ? { variableContext: def.variableContext } : {}),
		// `options` maps to Markdoc's `matches` — the editor surfaces these
		// as autocomplete items for the attribute's value, AND the validator
		// rejects call-site values outside the set. Only meaningful when the
		// underlying type accepts the option values (typically string).
		...(overrides.options && overrides.options.length > 0
			? { matches: [...overrides.options] }
			: {})
	};
	return attr;
}
