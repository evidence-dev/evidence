<script>
	import getColumnSummary from '$lib/modules/getColumnSummary.js';
	import { formatValue } from '$lib/modules/formatting.js';
	import { convertColumnToDate } from '$lib/modules/dateParsing.js';
	import checkInputs from '$lib/modules/checkInputs.js';
	import { strictBuild } from './context';

	export let data = null;
	export let row = 0;
	export let column = null;

	let value;
	let fmt;
	let error;

	let columnSummary;
	$: {
		try {
			error = undefined;
			if (data) {
				if (typeof data == 'string') {
					throw Error(`Received: data=${data}, expected: data={${data}}`);
				}

				if (!Array.isArray(data)) {
					// Accept bare objects
					data = [data];
				}

				if (isNaN(row)) {
					throw Error('row must be a number (row=' + row + ')');
				}

				try {
					Object.keys(data[row])[0];
				} catch (e) {
					throw Error('Row ' + row + ' does not exist in the dataset');
				}

				column = column ?? Object.keys(data[row])[0];

				checkInputs(data, [column]);

				columnSummary = getColumnSummary(data, 'array');
				let dateCols = columnSummary.filter((d) => d.type === 'date');
				dateCols = dateCols.map((d) => d.id);
				if (dateCols.length > 0) {
					for (let i = 0; i < dateCols.length; i++) {
						data = convertColumnToDate(data, dateCols[i]);
					}
				}

				value = data[row][column];
				columnSummary = columnSummary.filter((d) => d.id === column);
				fmt = columnSummary[0].format;
			} else {
				throw Error(
					'No data provided. If you referenced a query result, check that the name is correct.'
				);
			}
		} catch (e) {
			error = e.message;
			if (strictBuild) {
				throw error;
			}
		}
	}
</script>

{#if !error}
	{formatValue(value, fmt)}
{:else}
	<span class="group inline cursor-help">
		<span
			class="border border-red-200 px-1 rounded-sm bg-red-100 text-red-700 text-xs xl:text-sm font-semibold font-mono tracking-wide"
		>
			error
		</span>
		<span
			class="w-56 group-hover:inline hidden absolute bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-sm text-gray-50 text-xs xl:text-sm border border-gray-900/80 font-mono translate-x-1 -translate-y-1 shadow-md "
			>{error}
		</span>
	</span>
{/if}
