<script context="module">
	import { Story } from '@storybook/addon-svelte-csf';
	import DataTable from './DataTable.svelte';
	import Column from './Column.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const flightData = Query.create(`SELECT * from flights limit 50`, query);

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Datatable',
		component: DataTable,
		argTypes: {
			rows: {
				control: 'number'
			},
			headerColor: {
				control: 'color'
			},
			headerFontColor: {
				control: 'color'
			},
			totalRow: {
				control: 'boolean'
			},
			totalRowColor: {
				control: 'color'
			},
			totalFontColor: {
				control: 'color'
			},
			rowNumber: {
				control: 'boolean'
			},
			rowLines: {
				control: 'boolean'
			},
			rowShading: {
				control: 'boolean'
			},
			backgroundColor: {
				control: 'color'
			},
			sortable: {
				control: 'boolean'
			},
			search: {
				control: 'boolean'
			},
			downloadable: {
				control: 'boolean'
			},
			formatColumnTitles: {
				control: 'boolean'
			},
			wrapTitles: {
				control: 'boolean'
			},
			compact: {
				control: 'boolean'
			},
			link: {
				control: 'string'
			},
			showLinkCol: {
				control: 'boolean'
			},
			generateMarkdown: {
				control: 'boolean'
			},
			emptySet: {
				control: 'boolean'
			},
			emptyMessage: {
				control: 'string'
			},
			groupBy: {
				control: 'string'
			},
			groupType: {
				control: 'select',
				options: ['accordion', 'section']
			},
			subtotals: {
				control: 'boolean'
			},
			subtotalFmt: {
				control: 'string'
			},
			groupsOpen: {
				control: 'boolean'
			},
			accordionRowColor: {
				control: 'color'
			},
			subtotalRowColor: {
				control: 'color'
			},
			subtotalFontColor: {
				control: 'color'
			},
			groupNamePosition: {
				control: 'select',
				options: ['top', 'middle', 'bottom']
			},
			columnArgs: {
				title: {
					control: 'string'
				},
				align: {
					control: 'select',
					options: ['left', 'center', 'right']
				},
				fmt: {
					control: 'string'
				},
				fmtColumn: {
					control: 'string'
				},
				totalAgg: {
					control: 'select'
				},
				totalFmt: {
					control: 'string'
				},
				weightCol: {
					control: 'string'
				},
				wrap: {
					control: 'boolean'
				},
				wrapTitle: {
					control: 'boolean'
				},
				contentType: {
					control: 'select',
					options: ['link', 'image', 'delta', 'colorscale', 'html']
				},
				colGroup: {
					control: 'string'
				},
				//contentType=images
				height: {
					control: 'number'
				},
				width: {
					control: 'number'
				},
				alt: {
					control: 'string'
				},
				//contentType=link
				linkLabel: {
					control: 'string'
				},
				openInNewTab: {
					control: 'boolean'
				},
				//contentType=delta
				deltaSymbol: {
					control: 'boolean'
				},
				downIsGood: {
					control: 'boolean'
				},
				showValue: {
					control: 'boolean'
				},
				neutralMin: {
					control: 'number'
				},
				neutralMax: {
					control: 'number'
				},
				chip: {
					control: 'boolean'
				},
				//contentType=colorscale
				scaleColor: {
					control: 'color'
				},
				colorMin: {
					control: 'number'
				},
				colorMid: {
					control: 'number'
				},
				colorMax: {
					control: 'number'
				},
				colorBreakpoints: {
					control: 'array'
				},
				scaleColumn: {
					control: 'string'
				}
			}
		}
	};
</script>

<Story name="Simple Case" let:args>
	<DataTable data={flightData} {...args} />
</Story>

<Story name="Selecting Specific Columns" let:args>
	<DataTable data={flightData} {...args}>
		<Column id="airline" title="Airline" />
		<Column id="fare" title="fare" />
		<Column id="departure_airport" title="Departure Airport" />
	</DataTable>
</Story>

<Story name="Custom Column Formatting" let:args>
	<DataTable data={flightData} {...args}>
		<Column id="airline" title="Airline" />
		<Column id="fare" title="fare" {...args} />
		<Column id="departure_airport" title="Departure Airport" />
	</DataTable>
</Story>

<Story name="With Search" args={{ search: true }} let:args>
	<DataTable data={flightData} title="Flights" {...args}>
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Groups">
	{@const data = Query.create(
		`SELECT * from flights where regulator in ('Afghanistan', 'Belgium', 'Canada', 'Denmark') limit 50`,
		query
	)}
	<DataTable {data} title="Flights" search groupBy="regulator">
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Search (Long Columns)">
	{@const data = Query.create(`SELECT * from blog_posts`, query)}
	<DataTable {data} title="Blog Posts" search />
</Story>
