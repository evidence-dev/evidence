<script>
	import { defaultExample, formatExample } from '@evidence-dev/component-utilities/formatting';
	export let formats;
</script>

<table class="w-full border-separate [border-spacing:0.5rem_0.5rem] -mx-2">
	<thead class="text-sm py-2">
		<th class="max-w-14 text-left font-medium">Format Name</th>
		<th class="min-w-20 text-left font-medium">Format Code</th>
		<th class="min-w-20 text-left font-medium">Example Input</th>
		<th class="min-w-20 text-right font-medium">Example Output</th>
	</thead>
	{#each formats as format}
		<tr>
			<td>{format.formatTag} </td>
			<td>{format.formatCode} </td>
			<td>
				<input
					id="id_format_row{format.formatTag}"
					placeholder={format.exampleInput || defaultExample(format.valueType)}
					bind:value={format.userInput}
					on:blur={(format.userInput = undefined)}
					class="rounded shadow-sm border border-base-300 px-2 py-1 text-sm w-full bg-base-100 focus:ring-base-300 focus:border-base-300 focus:outline-none focus:ring-1"
				/>
			</td>
			<td class="text-right max-w-0">
				{formatExample(format)}
			</td>
		</tr>
	{/each}
</table>
