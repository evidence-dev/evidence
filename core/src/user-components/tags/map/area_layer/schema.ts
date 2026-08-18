import type { UserComponentSchema } from '../../../types';
import type { ValidationError } from '@markdoc/markdoc';
import { ZodAttribute } from '../../../common/zod-attribute';
import { z } from 'zod';
import {
	and,
	validateEmptyAttributes,
	tableExists,
	validateSqlExpression,
	filtersExist,
	validateSqlOptions,
	validateFormatCode,
	validateDateRange
} from '../../../validators';
import { SQL_OPTIONS } from '../../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../../common/date-options';

const attributes = {
	data: {
		type: String,
		required: true,
		description: 'Name of the table to query',
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'Array of filter IDs to apply',
		suggestionType: 'filter',
		affectsQuery: true
	},
	geography: {
		type: String,
		required: false,
		matches: ['us_states', 'us_counties'],
		description: 'Pre-provided geography (use this OR geojson_url + geojson_id)',
		affectsQuery: false
	},
	match_by: {
		type: String,
		required: false,
		suggestionType: 'match_by',
		description:
			'How to match areas. For us_states: "name", "abbr", or "fips". For us_counties: "state-county" or "fips".',
		affectsQuery: false
	},
	geojson_url: {
		type: String,
		required: false,
		description: 'URL to custom GeoJSON file (use with geojson_id for custom maps)',
		affectsQuery: false
	},
	geojson_id: {
		type: ZodAttribute.create(z.union([z.string(), z.array(z.string())])),
		required: false,
		description:
			'GeoJSON property to join on. Use a string for single property (e.g., "NAME") or array for composite key (e.g., ["STATE", "COUNTY"]).',
		affectsQuery: false
	},
	area_id: {
		type: String,
		required: true,
		description: 'Column name in data that matches geo_id (e.g., "state_id")',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: true,
		description: 'Column or expression for coloring the choropleth (e.g., "sum(sales)")',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	color_scale: {
		type: ZodAttribute.create(z.array(z.string())),
		required: false,
		description:
			'Array of colors for the choropleth gradient. A single-color array auto-expands to [background, color].',
		affectsQuery: false
	},
	color_palette: {
		type: ZodAttribute.create(z.array(z.string())),
		required: false,
		description: 'Deprecated. Use `color_scale`.',
		affectsQuery: false,
		deprecated: true
	},
	min: {
		type: Number,
		required: false,
		description:
			'Lower bound for the color scale. Values below this clamp to the first color in the scale. Defaults to the minimum value in the data.',
		affectsQuery: false
	},
	max: {
		type: Number,
		required: false,
		description:
			'Upper bound for the color scale. Values above this clamp to the last color in the scale. Defaults to the maximum value in the data.',
		affectsQuery: false
	},
	midpoint: {
		type: Number,
		required: false,
		description:
			'Anchor a specific value (typically 0) at the middle of a diverging color scale. Requires a color_scale with 3 or more colors.',
		affectsQuery: false
	},
	show_unmatched: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Whether to show areas that do not have matching data',
		affectsQuery: false
	},
	tooltip: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show tooltips on hover',
		affectsQuery: false
	},
	tooltip_fields: {
		type: ZodAttribute.create(z.array(z.string()).optional()),
		required: false,
		description:
			'Array of SQL expressions for additional fields to show in tooltip (e.g., ["category", "emissions"])',
		affectsQuery: true
	},
	name_property: {
		type: String,
		required: false,
		description: 'GeoJSON property to use for area name in tooltip (defaults to "NAME")',
		affectsQuery: false
	},
	value_fmt: {
		type: String,
		required: false,
		default: 'num',
		description: 'Format for values in tooltip',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	zoom_threshold: {
		type: ZodAttribute.create(
			z.tuple([z.number().min(0).max(22), z.number().min(0).max(22)]).optional()
		),
		required: false,
		description:
			'Zoom range [min, max] where this layer is visible (e.g., [0, 8] shows layer from zoom 0 to 8)',
		affectsQuery: false
	},
	legend: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show legend for this layer',
		affectsQuery: false
	},
	legend_label: {
		type: String,
		required: false,
		description: 'Custom label for the legend (defaults to table name)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	...DATE_RANGE_ATTRIBUTE,
	...SQL_OPTIONS
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'area_layer',
	category: 'map_slot',
	selfClosing: true,
	description: 'Add a choropleth layer to a map',
	attributes,
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('area_id', 'data', 'select'),
		validateSqlExpression('value', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateDateRange(),
		validateSqlOptions(),
		validateFormatCode('value_fmt'),
		validateEmptyAttributes(),
		// Validate geography config
		(node) => {
			const hasGeography = !!node.attributes.geography;
			const hasMatchBy = !!node.attributes.match_by;
			const hasGeojsonUrl = !!node.attributes.geojson_url;
			const hasGeojsonId = !!node.attributes.geojson_id;

			const errors: ValidationError[] = [];

			// Must have either geography OR custom geojson
			if (!hasGeography && !hasGeojsonUrl) {
				errors.push({
					id: 'missing-geography',
					level: 'error' as const,
					message:
						'area_layer: Either "geography" with "match_by" OR "geojson_url" with "geojson_id" must be provided',
					location: node.location
				});
			}

			// geography requires match_by
			if (hasGeography && !hasMatchBy) {
				errors.push({
					id: 'missing-match-by',
					level: 'error' as const,
					message: 'area_layer: "match_by" is required when using "geography"',
					location: node.location
				});
			}

			// geojson_url requires geojson_id
			if (hasGeojsonUrl && !hasGeojsonId) {
				errors.push({
					id: 'missing-geojson-id',
					level: 'error' as const,
					message: 'area_layer: "geojson_id" is required when using "geojson_url"',
					location: node.location
				});
			}

			// Warn if both geography and geojson_url provided
			if (hasGeography && hasGeojsonUrl) {
				errors.push({
					id: 'conflicting-geography',
					level: 'warning' as const,
					message:
						'area_layer: Both "geography" and "geojson_url" provided. "geography" will take precedence.',
					location: node.location
				});
			}

			const minAttr = node.attributes.min;
			const maxAttr = node.attributes.max;
			const midpointAttr = node.attributes.midpoint;
			// Prefer the new attribute; fall back to the deprecated alias so pages
			// authored before the rename continue to validate midpoint correctly.
			const colorScaleAttr =
				node.attributes.color_scale ?? node.attributes.color_palette;

			if (
				typeof minAttr === 'number' &&
				typeof maxAttr === 'number' &&
				minAttr >= maxAttr
			) {
				errors.push({
					id: 'invalid-min-max',
					level: 'warning' as const,
					message: `area_layer: "min" (${minAttr}) must be less than "max" (${maxAttr}).`,
					location: node.location
				});
			}

			if (
				typeof midpointAttr === 'number' &&
				(!Array.isArray(colorScaleAttr) || colorScaleAttr.length < 3)
			) {
				errors.push({
					id: 'midpoint-without-diverging-palette',
					level: 'warning' as const,
					message:
						'area_layer: "midpoint" only takes effect when "color_scale" has 3 or more colors.',
					location: node.location
				});
			}

			if (
				typeof midpointAttr === 'number' &&
				typeof minAttr === 'number' &&
				typeof maxAttr === 'number' &&
				(midpointAttr <= minAttr || midpointAttr >= maxAttr)
			) {
				errors.push({
					id: 'midpoint-outside-range',
					level: 'warning' as const,
					message: `area_layer: "midpoint" (${midpointAttr}) must be strictly between "min" (${minAttr}) and "max" (${maxAttr}); the scale will fall back to a linear gradient.`,
					location: node.location
				});
			}

			return errors;
		}
	),
	allowedParents: ['map'],
	componentWrapper: {
		display: 'none'
	},
	examples: [
		{
			title: 'US States by Name',
			hero: true,
			example: `
{% map %}
    {% area_layer
        geography="us_states"
        match_by="name"
        data="state_sales"
        area_id="state"
        value="sum(sales)"
    /%}
{% /map %}
`
		},
		{
			title: 'US States by Abbreviation',
			example: `
{% map %}
    {% area_layer
        geography="us_states"
        match_by="abbr"
        data="state_sales"
        area_id="state_abbr"
        value="sum(sales)"
    /%}
{% /map %}
`
		},
		{
			title: 'US Counties by State + County',
			example: `
{% map %}
    {% area_layer
        geography="us_counties"
        match_by="state-county"
        data="county_sales"
        area_id="state || '-' || county"
        value="sum(sales)"
    /%}
{% /map %}
`
		},
		{
			title: 'US Counties by FIPS',
			example: `
{% map %}
    {% area_layer
        geography="us_counties"
        match_by="fips"
        data="county_sales"
        area_id="state_fips || county_fips"
        value="sum(sales)"
    /%}
{% /map %}
`
		},
		{
			title: 'Custom GeoJSON',
			example: `
{% area_layer
    geojson_url="https://example.com/custom.geojson"
    geojson_id="id"
    data="my_data"
    area_id="region_id"
    value="sum(sales)"
/%}
`
		},
		{
			title: 'Diverging Scale Centered at 0',
			example: `
{% map %}
    {% area_layer
        geography="us_states"
        match_by="abbr"
        data="state_growth"
        area_id="state_abbr"
        value="growth_pct"
        color_scale=["#d73027", "#ffffbf", "#1a9850"]
        min=-100
        max=100
        midpoint=0
    /%}
{% /map %}
`
		}
	]
} as const satisfies UserComponentSchema;
