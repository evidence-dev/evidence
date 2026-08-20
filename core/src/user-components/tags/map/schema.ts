import type { UserComponentSchema } from '../../types';
import {
	validateEmptyAttributes,
	validateInfoRequiresTitle,
	validateVariablesInComponent,
	and
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';

const attributes = {
	title: {
		type: String,
		required: false,
		description: 'Title to display above the map',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle to display below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description: 'Information tooltip text (can only be used with title)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	height: {
		type: Number,
		required: false,
		default: 300,
		description: 'Height of the map in pixels',
		affectsQuery: false
	},
	initial_position: {
		type: ZodAttribute.create(
			z
				.tuple([z.number(), z.number()])
				.refine(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180, {
					message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
				})
		),
		required: false,
		description:
			'Initial map center position as [latitude, longitude]. Overrides auto-zoom to data bounds',
		affectsQuery: false
	},
	zoom: {
		type: Number,
		required: false,
		description:
			'Zoom level (0-22, where higher is more zoomed in). When provided without initial_position, centers on data at this zoom level. When provided with initial_position, uses this zoom at that position',
		affectsQuery: false
	},
	zoomable: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Allow users to zoom in/out on the map',
		affectsQuery: false
	},
	pannable: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Allow users to pan/drag the map',
		affectsQuery: false
	},
	base_style: {
		type: String,
		required: false,
		default: 'mono',
		matches: ['mono', 'blank'],
		description:
			'Base map style: "mono" for theme-aware monochrome basemap, "blank" for solid background only',
		affectsQuery: false
	},
	projection: {
		type: String,
		required: false,
		default: 'flat',
		matches: ['globe', 'flat'],
		description: 'Map projection: "globe" for 3D globe view, "flat" for 2D flat map',
		affectsQuery: false
	},
	legend: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show legends for map layers',
		affectsQuery: false
	},
	legend_location: {
		type: String,
		required: false,
		default: 'bottom_right',
		matches: ['top_left', 'top_right', 'bottom_left', 'bottom_right'],
		description: 'Location of the legend within the map',
		affectsQuery: false
	},
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'map',
	category: 'map',
	validate: and(
		validateEmptyAttributes(),
		validateInfoRequiresTitle,
		validateVariablesInComponent()
	),
	selfClosing: false,
	description: 'Display an interactive map',
	keywords: ['geographic map', 'geo map', 'choropleth', 'globe'],
	attributes,
	allowedChildren: ['area_layer', 'point_layer', 'heatmap_layer'],
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250,
			minHeight: 300
		}
	},
	examples: [
		{
			title: 'Basic Map',
			hero: true,
			example: `
{% map %}
{% /map %}
`
		},
		{
			title: 'Map with Title',
			example: `
{% map title="Sales by Region" %}
{% /map %}
`
		},
		{
			title: 'Custom Height',
			example: `
{% map height=500 %}
{% /map %}
`
		},
		{
			title: 'Custom Zoom Level',
			example: `
{% map zoom=10 %}
{% /map %}
`
		},
		{
			title: 'Map with Choropleth Layer',
			example: `
\`\`\`sql east_coast_states
    select 'Maine' as state, 1362359 as population union all 
    select 'New Hampshire', 1377529 union all 
    select 'Vermont', 643077 union all 
    select 'Massachusetts', 7029917 union all 
    select 'Rhode Island', 1097379 union all 
    select 'Connecticut', 3605944 union all 
    select 'New York', 20201249 union all 
    select 'New Jersey', 9288994 union all 
    select 'Pennsylvania', 13002700 union all 
    select 'Delaware', 989948 union all 
    select 'Maryland', 6177224
\`\`\`

{% map %}
    {% area_layer
        geography="us_states"
        match_by="name"
        data="east_coast_states"
        area_id="state"
        value="population"
    /%}
{% /map %}
`
		},
		{
			title: 'Map with Point Layer',
			example: `
\`\`\`sql us_stores
select 40.7128 as lat, -74.0060 as lng, 1250000 as sales union all
select 34.0522, -118.2437, 980000 union all
select 41.8781, -87.6298, 875000 union all
select 29.7604, -95.3698, 720000 union all
select 33.4484, -112.0740, 650000 union all
select 39.9526, -75.1652, 590000 union all
select 29.4241, -98.4936, 480000 union all
select 32.7157, -117.1611, 520000 union all
select 32.7767, -96.7970, 810000 union all
select 37.3382, -121.8863, 690000 union all
select 30.2672, -97.7431, 560000 union all
select 47.6062, -122.3321, 920000
\`\`\`

{% map title="Store Locations" %}
    {% point_layer
        data="us_stores"
        lat="lat"
        lng="lng"
        color_value="sales"
        color_palette=["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"]
    /%}
{% /map %}
`
		},
		{
			title: 'Map with Heatmap Layer',
			example: `
{% map title="Activity Density" %}
    {% heatmap_layer
        data="events"
        lat="latitude"
        lng="longitude"
        weight="event_count"
    /%}
{% /map %}
`
		}
	]
} as const satisfies UserComponentSchema;
