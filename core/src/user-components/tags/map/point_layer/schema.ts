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
		affectsQuery: true
	},
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'Array of filter IDs to apply',
		suggestionType: 'filter',
		affectsQuery: true
	},
	lat: {
		type: String,
		required: true,
		description: 'Column name for latitude values',
		suggestionType: 'column',
		affectsQuery: true
	},
	lng: {
		type: String,
		required: true,
		description: 'Column name for longitude values',
		suggestionType: 'column',
		affectsQuery: true
	},
	color_value: {
		type: String,
		required: false,
		description:
			'Column or expression for coloring points. Numeric values create a gradient scale, categorical values (strings) assign discrete colors from the palette. Examples: "sum(sales)" (numeric gradient), "category" (categorical colors)',
		suggestionType: 'sql',
		affectsQuery: true
	},
	size_value: {
		type: String,
		required: false,
		description:
			'Column or expression for sizing points (e.g., "sum(customers)"). If not provided, all points will be the same size',
		suggestionType: 'sql',
		affectsQuery: true
	},
	point_title: {
		type: String,
		required: false,
		description:
			'Column name to use as the point title in tooltips (e.g., "city_name"). If not provided, lat/lng will be shown',
		suggestionType: 'column',
		affectsQuery: true
	},
	point_subtitle: {
		type: String,
		required: false,
		description:
			'Column name to use as the point subtitle in tooltips (e.g., "region"). Displays as a second line with muted text',
		suggestionType: 'column',
		affectsQuery: true
	},
	shape: {
		type: String,
		required: false,
		default: 'circle',
		matches: ['circle', 'pin', 'square', 'triangle', 'star', 'diamond'],
		description: 'Shape of the point marker',
		affectsQuery: false
	},
	cluster: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Group nearby points into aggregated bubbles that split apart as you zoom in. Recommended for large datasets (thousands of points); raises the point fetch limit so there is enough data to cluster.',
		affectsQuery: true
	},
	color: {
		type: String,
		required: false,
		description: 'Single color for all points (hex, rgb/rgba, or CSS color name)',
		affectsQuery: false
	},
	color_palette: {
		type: ZodAttribute.create(z.array(z.string())),
		required: false,
		description:
			'Array of colors for coloring. For numeric color_value: creates gradient. For categorical color_value: assigns discrete colors to categories (cycles if more categories than colors)',
		affectsQuery: false
	},
	min: {
		type: Number,
		required: false,
		description:
			'Lower bound for the numeric color scale. Values below this clamp to the first color in the palette. Ignored for categorical color_value. Defaults to the minimum value in the data.',
		affectsQuery: false
	},
	max: {
		type: Number,
		required: false,
		description:
			'Upper bound for the numeric color scale. Values above this clamp to the last color in the palette. Ignored for categorical color_value. Defaults to the maximum value in the data.',
		affectsQuery: false
	},
	midpoint: {
		type: Number,
		required: false,
		description:
			'Anchor a specific value (typically 0) at the middle of a diverging color palette. Requires a numeric color_value and a color_palette with 3 or more colors.',
		affectsQuery: false
	},
	size: {
		type: Number,
		required: false,
		default: 6,
		description: 'Base size of points in pixels',
		affectsQuery: false
	},
	size_scale: {
		type: Number,
		required: false,
		default: 1,
		description:
			'Scale multiplier for value-based sizing. Higher values create larger size differences',
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
	color_value_fmt: {
		type: String,
		required: false,
		default: 'num',
		description: 'Format for color values in tooltip',
		affectsQuery: false,
		suggestionType: 'format'
	},
	size_value_fmt: {
		type: String,
		required: false,
		default: 'num',
		description: 'Format for size values in tooltip',
		affectsQuery: false,
		suggestionType: 'format'
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
		affectsQuery: false
	},
	...DATE_RANGE_ATTRIBUTE,
	...SQL_OPTIONS
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'point_layer',
	category: 'map_slot',
	selfClosing: true,
	description: 'Add a point layer to a map showing lat/lng coordinates',
	attributes,
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('lat', 'data', 'select'),
		validateSqlExpression('lng', 'data', 'select'),
		validateSqlExpression('color_value', 'data', 'select'),
		validateSqlExpression('size_value', 'data', 'select'),
		validateSqlExpression('point_title', 'data', 'select'),
		validateSqlExpression('point_subtitle', 'data', 'select'),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateDateRange(),
		validateSqlOptions(),
		validateFormatCode('color_value_fmt'),
		validateFormatCode('size_value_fmt'),
		validateEmptyAttributes(),
		// Validate that color_palette is only useful with color_value
		(node) => {
			const errors: ValidationError[] = [];
			const hasColorPalette = !!node.attributes.color_palette;
			const hasColorValue = !!node.attributes.color_value;

			if (hasColorPalette && !hasColorValue) {
				errors.push({
					id: 'color-palette-without-value',
					level: 'warning' as const,
					message: 'point_layer: "color_palette" has no effect without "color_value" attribute',
					location: node.location
				});
			}

			const minAttr = node.attributes.min;
			const maxAttr = node.attributes.max;
			const midpointAttr = node.attributes.midpoint;
			const colorPaletteAttr = node.attributes.color_palette;

			if (typeof minAttr === 'number' && typeof maxAttr === 'number' && minAttr >= maxAttr) {
				errors.push({
					id: 'invalid-min-max',
					level: 'warning' as const,
					message: `point_layer: "min" (${minAttr}) must be less than "max" (${maxAttr}).`,
					location: node.location
				});
			}

			if (
				typeof midpointAttr === 'number' &&
				(!Array.isArray(colorPaletteAttr) || colorPaletteAttr.length < 3)
			) {
				errors.push({
					id: 'midpoint-without-diverging-palette',
					level: 'warning' as const,
					message:
						'point_layer: "midpoint" only takes effect when "color_palette" has 3 or more colors.',
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
					message: `point_layer: "midpoint" (${midpointAttr}) must be strictly between "min" (${minAttr}) and "max" (${maxAttr}); the scale will fall back to a linear gradient.`,
					location: node.location
				});
			}

			if (
				(minAttr !== undefined || maxAttr !== undefined || midpointAttr !== undefined) &&
				!hasColorValue
			) {
				errors.push({
					id: 'min-max-without-color-value',
					level: 'warning' as const,
					message:
						'point_layer: "min", "max", and "midpoint" only apply when "color_value" is set.',
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
			title: 'Basic Point Map',
			hero: true,
			example: `
{% map %}
    {% point_layer
        data="store_locations"
        lat="latitude"
        lng="longitude"
        point_title="store_name"
    /%}
{% /map %}
`
		},
		{
			title: 'Colored by Value',
			example: `
{% map %}
    {% point_layer
        data="store_sales"
        lat="latitude"
        lng="longitude"
        point_title="store_name"
        color_value="sum(sales)"
        color_palette=["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"]
        color_value_fmt="usd"
    /%}
{% /map %}
`
		},
		{
			title: 'Sized by Value',
			example: `
{% map %}
    {% point_layer
        data="store_locations"
        lat="latitude"
        lng="longitude"
        point_title="store_name"
        size_value="sum(customers)"
    /%}
{% /map %}
`
		},
		{
			title: 'Color and Size by Different Values',
			example: `
{% map %}
    {% point_layer
        data="store_metrics"
        lat="latitude"
        lng="longitude"
        color_value="sum(sales)"
        size_value="sum(customers)"
        color_palette=["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"]
    /%}
{% /map %}
`
		},
		{
			title: 'Categorical Coloring',
			example: `
{% point_layer
    data="locations"
    lat="latitude"
    lng="longitude"
    point_title="name"
    color_value="category"
    color_palette=["#154886", "#45a1bf", "#a5cdee", "#8dacbf", "#85c7c6"]
/%}
`
		},
		{
			title: 'Custom Tooltip Fields',
			example: `
{% map %}
    {% point_layer
        data="power_plants"
        lat="latitude"
        lng="longitude"
        point_title="name"
        point_subtitle="region"
        tooltip_fields=["fuel_type", "capacity_mw", "emissions"]
    /%}
{% /map %}
`
		},
		{
			title: 'Clustered (large datasets)',
			example: `
{% map %}
    {% point_layer
        data="stations"
        lat="latitude"
        lng="longitude"
        cluster=true
    /%}
{% /map %}
`
		}
	]
} as const satisfies UserComponentSchema;
