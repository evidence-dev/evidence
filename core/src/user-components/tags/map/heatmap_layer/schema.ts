import type { UserComponentSchema } from '../../../types';
import { ZodAttribute } from '../../../common/zod-attribute';
import { z } from 'zod';
import {
	and,
	validateEmptyAttributes,
	tableExists,
	validateSqlExpression,
	filtersExist,
	validateSqlOptions,
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
	weight: {
		type: String,
		required: false,
		description:
			'Column or expression for weighting points in the heatmap (e.g., "sum(sales)"). Higher values create more intense heat',
		suggestionType: 'sql',
		affectsQuery: true
	},
	radius: {
		type: Number,
		required: false,
		default: 30,
		description: 'Base radius of influence for each point in pixels (adjusts with zoom)',
		affectsQuery: false
	},
	intensity: {
		type: Number,
		required: false,
		default: 1,
		description: 'Intensity multiplier for the heatmap. Higher values create more pronounced heat',
		affectsQuery: false
	},
	opacity: {
		type: Number,
		required: false,
		default: 0.8,
		description: 'Opacity of the heatmap layer (0-1)',
		affectsQuery: false
	},
	color_scale: {
		type: ZodAttribute.create(z.array(z.string())),
		required: false,
		description:
			'Array of colors for the heatmap gradient, from lowest to highest density. A single-color array auto-expands to [background, color]. Defaults to the theme color scale.',
		affectsQuery: false
	},
	color_palette: {
		type: ZodAttribute.create(z.array(z.string())),
		required: false,
		description: 'Deprecated. Use `color_scale`.',
		affectsQuery: false,
		deprecated: true
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
	...DATE_RANGE_ATTRIBUTE,
	...SQL_OPTIONS
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'heatmap_layer',
	category: 'map_slot',
	selfClosing: true,
	description: 'Add a heatmap layer to a map showing density of lat/lng coordinates',
	attributes,
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('lat', 'data', 'select'),
		validateSqlExpression('lng', 'data', 'select'),
		validateSqlExpression('weight', 'data', 'select'),
		validateDateRange(),
		validateSqlOptions(),
		validateEmptyAttributes(),
		// Validate opacity is between 0 and 1
		(node) => {
			const opacity = node.attributes.opacity as number | undefined;
			if (opacity !== undefined && (opacity < 0 || opacity > 1)) {
				return [
					{
						id: 'invalid-opacity',
						level: 'error' as const,
						message: 'heatmap_layer: "opacity" must be between 0 and 1',
						location: node.location
					}
				];
			}
			return [];
		}
	),
	allowedParents: ['map'],
	componentWrapper: {
		display: 'none'
	},
	examples: [
		{
			title: 'Basic Heatmap',
			hero: true,
			example: `
{% map %}
    {% heatmap_layer
        data="events"
        lat="latitude"
        lng="longitude"
    /%}
{% /map %}
`
		},
		{
			title: 'Weighted Heatmap',
			example: `
{% map %}
    {% heatmap_layer
        data="sales"
        lat="latitude"
        lng="longitude"
        weight="sum(revenue)"
    /%}
{% /map %}
`
		},
		{
			title: 'Custom Color Palette',
			example: `
{% map %}
    {% heatmap_layer
        data="incidents"
        lat="latitude"
        lng="longitude"
        color_scale=["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"]
    /%}
{% /map %}
`
		},
		{
			title: 'Adjusted Radius and Intensity',
			example: `
{% map %}
    {% heatmap_layer
        data="visits"
        lat="latitude"
        lng="longitude"
        weight="visit_count"
        radius=50
        intensity=2
    /%}
{% /map %}
`
		}
	]
} as const satisfies UserComponentSchema;
