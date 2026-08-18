import type {
	CustomAttributeType,
	Schema as MarkdocSchema,
	SchemaAttribute as MarkdocSchemaAttribute,
	ValidationError,
	ValidationType
} from '@markdoc/markdoc';
import type { FilterClass } from '../Filter.svelte';
import type { Component, Snippet } from 'svelte';
import type { Simplify } from 'type-fest';
import { z } from 'zod';
import type { UserComponentModelClass } from './UserComponentModel';
import type { DataSource } from './common/data-sources';

type NoneComponentWrapperConfig = { display: 'none' };

type InlineComponentWrapperConfig = { display: 'inline' };
export type UserComponentFlex = {
	/** How much space this component should take up in a row relative to other components (flex-grow) */
	grow: number | 'children';

	/**
	 * Minimum width of the component in pixels.
	 *
	 * The component should be comfortable rendering down to this width without overflow or other layout issues. When a
	 * component reaches its minimum width in a `row`, the row will wrap components to new lines to preserve the
	 * minimum width requirement.
	 */
	minWidth: number | 'children';

	/**
	 * Minimum height of the component in pixels.
	 *
	 * The component should be comfortable rendering down to this height without overflow or other layout issues.
	 * Components in a stack will start at their minimum height and grow to fill the stack according to `flex.grow`.
	 *
	 * This is only necessary for components that have a dynamic height, for example
	 * - a chart can grow/shrink in height to show more/less resolution
	 *
	 * NOT necessary for components that have a fixed height or fit their contents, for example
	 * - a `dropdown` is always the same height
	 * - `details` fits the height of the text within
	 */
	minHeight?: number | 'children';

	/**
	 * Consecutive (in the markdown content) components with `automaticallyWrapConsecutiveComponentsInRow=true` will automatically be wrapped with a `row`
	 * component.
	 *
	 * For example:
	 * ```markdown
	 * {% my_component /%}
	 * {% my_component /%}
	 * {% other /%}
	 * {% my_component /%}
	 * ```
	 *
	 * If `my_component` has `automaticallyWrapConsecutiveComponentsInRow=true`, this is what will be effectively rendered
	 * ```markdown
	 * {% row %}
	 *   {% my_component /%}
	 *   {% my_component /%}
	 * {% /row %}
	 * {% other /%}
	 * {% my_component /%}
	 * ```
	 */
	automaticallyWrapConsecutiveComponentsInRow?: boolean;
};
type BlockComponentWrapperConfig = {
	display: 'block';

	/** Should the width of the component wrapper fit the user component, or fill the width of the page */
	width: 'fit' | 'full';

	/** Don't render a card around the component (even when `pages.settings.cards=true`) */
	noCard?: boolean;

	/** Use compact error display instead of full overlay */
	compactErrors?: boolean;

	/** Control how this element takes up space in a row or stack layout */
	flex?: UserComponentFlex | undefined;
};

export type UserComponentSchema = Omit<MarkdocSchema, 'validate' | 'children'> & {
	// render is required
	render: string;

	// attributes is required, use our type with additional properties
	attributes: Record<string, UserComponentAttribute>;

	// Don't allow returning promises
	validate?: (...args: Parameters<NonNullable<MarkdocSchema['validate']>>) => ValidationError[];

	/**
	 * Declarative list of valid attribute arrangements for this component. One
	 * entry must fully match at validation time (all `requires` present, no
	 * `forbids` present). Use for components with genuinely exclusive modes —
	 * e.g. big_value's `data`+`value` vs `metric`. Not for additive combos.
	 *
	 * When set, the component's `validate:` array must include
	 * `validateDataSources(dataSources)` so the check actually fires; the
	 * top-level declaration is read by autocomplete, docs generation, and the
	 * AI's readiness check.
	 */
	dataSources?: readonly DataSource[];

	/**
	 * Show a validation error if this component has a child not in this list
	 * Also helps trim down the component selection list
	 * Leave this `undefined` if this component can have any children
	 */
	allowedChildren?: string[];

	/**
	 * Show a validation error if this component is placed within a parent not in this list
	 * Also helps trim down the component selection list
	 * Leave this `undefined` if this component can be a child of any other component
	 */
	allowedParents?: string[];

	/**
	 * Whether this component is a filter input that should be allowed as a child of filter_bar.
	 * Filter inputs include: dropdown, date_grain_selector, comparison_selector, range_calendar, table_filter.
	 * This is used by filter_bar to determine which components can be its children.
	 */
	isFilterInput?: boolean;

	/** `false` prevents ComponentWrapper from being rendered around the user component */
	componentWrapper:
		| false
		| InlineComponentWrapperConfig
		| BlockComponentWrapperConfig
		| NoneComponentWrapperConfig;

	/**
	 * If true, this component will not be included in generated documentation.
	 */
	undocumented?: boolean;

	/**
	 * If true, this component is deprecated and will be hidden from autocomplete suggestions.
	 * The component will still work for backwards compatibility.
	 */
	deprecated?: boolean;

	/**
	 * Optional array of usage examples for this component. Each example has a title and a multiline markdown string.
	 */
	examples?: Array<{
		title: string;
		hero?: boolean;
		example: string;
	}>;

	/**
	 * Optional component-specific MDX sections rendered into the generated
	 * docs page between `## Examples` and `## Attributes`. Use when a
	 * component has a piece of reference data the docs need to expose AND
	 * the data lives in code (so we want it generated, not hand-written) —
	 * e.g. the {% html %} block's network allowlist, which is sourced from
	 * `html-csp.ts` constants. The string is dropped into the MDX verbatim,
	 * so it should be valid MDX (no schema-level escaping).
	 */
	extraDocsSections?: Array<{
		title: string;
		content: string;
	}>;

	/**
	 * Optional filter properties that are available when this component is used as a filter.
	 * These will be documented in the generated docs.
	 */
	filterProperties?: Array<{
		name: string;
		description: string;
		example?: string;
		/** Which contexts this property is the default for */
		defaultFor?: ('sql' | 'text' | 'column')[];
		/** Example value when nothing is selected */
		noSelectionValue?: string;
		/** Example value for single selection */
		singleValue?: string;
		/** Example value for multi selection */
		multiValue?: string;
	}>;

	/**
	 * Optional custom snippet to insert when this component is selected from autocomplete.
	 * If not provided, a snippet will be auto-generated based on the component's attributes.
	 * Supports Monaco editor snippet syntax with placeholders like $1, $2, etc.
	 */
	snippet?: string;

	/**
	 * Optional keywords for documentation search.
	 * These help users find this component when searching for related terms.
	 * Keywords are included in the generated documentation for better discoverability.
	 */
	keywords?: string[];

	/**
	 * Component category for documentation organization.
	 * - 'value': Value display components (value, big_value, delta)
	 * - 'table': Table components (table, dimension, measure, pivot)
	 * - 'chart': Chart components (bar_chart, line_chart, etc.)
	 * - 'chart_slot': Components that go inside charts (area, bar, reference_line, callout, sparkline, etc.)
	 * - 'map': Map components (map)
	 * - 'map_slot': Components that go inside maps (area_layer, point_layer, heatmap_layer)
	 * - 'input': Input/filter components (dropdown, slider, etc.)
	 * - 'ui': UI/layout components (row, stack, accordion, etc.)
	 * - 'logic': Logic/conditional components (if, else_if, else, repeat)
	 */
	category:
		| 'value'
		| 'table'
		| 'chart'
		| 'chart_slot'
		| 'map'
		| 'map_slot'
		| 'input'
		| 'ui'
		| 'logic';

	/**
	 * Language of the tag's body. Defaults to 'markdoc' when absent — the body is
	 * parsed as Markdoc content (paragraphs, tags, text) and walked by text-level
	 * validators looking for `{{ }}` references.
	 *
	 * When set to anything else, the body is opaque source code in that language
	 * (e.g. JSON5 for custom_echart) recovered via the schema's transform — text
	 * walkers like `validateFilterVariables` skip the children to avoid running
	 * SQL/template balance checks against code that contains JSON braces or
	 * other syntactically-confusing characters. The tag remains responsible for
	 * its own body validation (e.g. via a per-reference validator that walks
	 * the raw source).
	 */
	bodyLanguage?: 'markdoc' | 'json5' | 'html' | 'javascript';
};

export type UserComponentAttributes = UserComponentSchema['attributes'];

export type UserComponentSchemaWithComponentWrapper = UserComponentSchema & {
	componentWrapper: Exclude<UserComponentSchema['componentWrapper'], false>;
};

export const hasComponentWrapper = (
	schema: UserComponentSchema
): schema is UserComponentSchemaWithComponentWrapper => Boolean(schema.componentWrapper);

export interface AttributeTypeWithZodSchema<
	S extends z.ZodTypeAny = z.ZodTypeAny
> extends CustomAttributeType {
	zodSchema: S;
}

export const hasZodSchema = (input: unknown): input is { zodSchema: z.ZodTypeAny } =>
	(typeof input === 'object' || typeof input === 'function') &&
	input !== null &&
	'zodSchema' in input &&
	input.zodSchema instanceof z.ZodType;

// Disallow string types (e.g. 'String', 'Number') for consistency
export type AttributeType =
	| typeof String
	| typeof Number
	| typeof Boolean
	| typeof Object
	| typeof Array
	| AttributeTypeWithZodSchema;

export type UserComponentAttribute = Omit<MarkdocSchemaAttribute, 'type'> & {
	type: AttributeType | AttributeType[];
	suggested?: boolean;
	suggestionType?:
		| 'table'
		| 'column'
		| 'dateColumn'
		| 'filter'
		| 'sql'
		| 'format'
		| 'partial'
		| 'date_range'
		| 'custom_ranges'
		| 'tooltip_fields'
		| 'comparison'
		| 'match_by'
		| 'metric';
	affectsQuery?: boolean;
	keywords?: string[];
	/** Whether this attribute supports filter variable interpolation ({{ filterId.property }}) */
	supportsVariables?: boolean;
	/**
	 * Context for variable interpolation. Determines how variable values are formatted:
	 * - 'sql': Quoted values for WHERE/HAVING clauses (e.g., category = '{{filter}}')
	 * - 'column': Unquoted values for SQL column expressions (e.g., x="{{metric}}")
	 * - 'text': Unquoted values for display (e.g., title="{{label}}")
	 *
	 * If not set, inferred from suggestionType:
	 * - 'sql', 'column', 'dateColumn' → 'column'
	 * - Others → 'text'
	 */
	variableContext?: 'sql' | 'column' | 'text';
	/** If true, this attribute is deprecated and should be hidden from autocomplete */
	deprecated?: boolean;
};

export type ExtractZodSchemaType<C> = C extends { zodSchema: infer S extends z.ZodTypeAny }
	? z.infer<S>
	: never;

// prettier-ignore
export type AttributeTypeToJsType<T> = 
		T extends typeof String ? string
	: T extends typeof Number ? number
	: T extends typeof Boolean ? boolean
	: T extends typeof Object ? Record<string, unknown>
	: T extends typeof Array ? unknown[]
	: T extends AttributeTypeWithZodSchema ? ExtractZodSchemaType<T>
	: unknown;

type AttributeToJsType<A extends UserComponentAttribute> = A['matches'] extends string[]
	? A['matches'][number]
	: A['type'] extends ValidationType
		? AttributeTypeToJsType<A['type']>
		: A['type'] extends ValidationType[]
			? AttributeTypeToJsType<A['type'][number]>
			: unknown;

type AttributeAlwaysExists<Attribute extends UserComponentAttribute> =
	Attribute['required'] extends true ? true : undefined extends Attribute['default'] ? false : true;

type AttributesThatAlwaysExist<Attributes extends UserComponentAttributes> = {
	[K in keyof Attributes]: AttributeAlwaysExists<Attributes[K]> extends true ? K : never;
}[keyof Attributes];

type AttributesThatMightNotExist<Attributes extends UserComponentAttributes> = {
	[K in keyof Attributes]: AttributeAlwaysExists<Attributes[K]> extends true ? never : K;
}[keyof Attributes];

export type UserComponentAttributesToProps<Attributes extends UserComponentAttributes> = {
	[K in AttributesThatMightNotExist<Attributes>]?: AttributeToJsType<Attributes[K]>;
} & {
	[K in AttributesThatAlwaysExist<Attributes>]: AttributeToJsType<Attributes[K]>;
};

type UserComponentPropsWithChildren<Attributes extends UserComponentAttributes> =
	UserComponentAttributesToProps<Attributes> & {
		children?: Snippet<[]>;
	};

export type UserComponentProps<
	Schema extends Pick<UserComponentSchema, 'selfClosing' | 'attributes'>
> = Simplify<
	Schema['selfClosing'] extends true
		? UserComponentAttributesToProps<Schema['attributes']>
		: UserComponentPropsWithChildren<Schema['attributes']>
>;

export type UserComponent<Schema extends UserComponentSchema = UserComponentSchema> = {
	schema: Schema & { render: string };
	Component?: Component<UserComponentProps<Schema>>;
	Filter?: FilterClass<Schema['render'], UserComponentProps<Schema>>;
	Model?: UserComponentModelClass<{
		Attributes: UserComponentProps<Schema>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ParentRequired: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Serialized: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ValidChildren: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ValidParents: any;
	}>;
};

export interface DataPoint {
	[key: string]: string | number | Date | null | undefined;
}

export interface Dimension {
	name: string;
	label?: string;
	type?: string;
}

export interface Measure {
	name: string;
	label?: string;
	type?: string;
	format?: string;
	aggregation?: string;
}

export interface Pivot {
	name: string;
	label?: string;
	type?: string;
}

export interface PivotedRow {
	dimensionValues: Record<string, string | number | Date | null>;
	pivotedValues: Record<string, Record<string, string | number | Date | null>>;
	row_render_type?: string;
}

export interface PivotOptions {
	dimensions: Dimension[];
	pivots: Pivot[];
	measures: Measure[];
	measuresFirst?: boolean;
}
