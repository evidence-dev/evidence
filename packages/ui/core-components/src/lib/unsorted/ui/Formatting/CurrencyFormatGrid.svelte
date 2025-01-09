<script>
	import { blur, slide } from 'svelte/transition';
	import { SUPPORTED_CURRENCIES } from '@evidence-dev/component-utilities/builtInFormats';
	import { defaultExample, formatExample } from '@evidence-dev/component-utilities/formatting';
	export let formats;
	let selectedCurrency = 'Choose a currency';
</script>

<div class="flex justify-center px-1">
	<select
		bind:value={selectedCurrency}
		class="w-full rounded-md shadow-sm border border-base-300 px-3 h-9 py-2 text-sm bg-base-100 focus:ring-base-300 focus:border-base-300 focus:outline-none focus:ring-1 cursor-pointer mt-1 mb-2"
	>
		<option>Choose a currency</option>
		${#each SUPPORTED_CURRENCIES as currency}
			<option name={currency.primaryCode} id={currency.primaryCode} value={currency.primaryCode}
				>{currency.displayName}</option
			>
		{/each}
	</select>
</div>
{#if selectedCurrency != 'Choose a currency'}
	<div transition:slide>
		<table class="w-full border-separate [border-spacing:0.5rem_0.5rem] -mx-2">
			<thead class="text-sm py-2">
				<th class="max-w-14 text-left font-medium">Format Name</th>
				<th class="min-w-20 text-left font-medium">Format Code</th>
				<th class="min-w-20 text-left font-medium">Example Input</th>
				<th class="min-w-20 text-right font-medium">Example Output</th>
			</thead>
			{#each formats.filter((d) => d.parentFormat === selectedCurrency) as format (format.formatTag)}
				<tr>
					<td in:blur|local>{format.formatTag} </td>
					<td in:blur|local>{format.formatCode} </td>
					<td>
						<input
							id="id_format_row{format.formatTag}"
							placeholder={format.exampleInput || defaultExample(format.valueType)}
							bind:value={format.userInput}
							on:blur={(format.userInput = undefined)}
							class="rounded shadow-sm border border-base-300 px-2 py-1 text-sm w-full bg-base-100 focus:ring-base-300 focus:border-base-300 focus:outline-none focus:ring-1"
						/>
					</td>
					<td class="text-right max-w-0" in:blur|local>{formatExample(format)}</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}
