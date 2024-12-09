<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { blur, slide } from 'svelte/transition';
	import { SUPPORTED_CURRENCIES } from '@evidence-dev/component-utilities/builtInFormats';
	import { defaultExample, formatExample } from '@evidence-dev/component-utilities/formatting';
	export let formats;
	let selectedCurrency = 'Choose a currency';
</script>

<select bind:value={selectedCurrency}>
	<option>Choose a currency</option>
	${#each SUPPORTED_CURRENCIES as currency}
		<option name={currency.primaryCode} id={currency.primaryCode} value={currency.primaryCode}
			>{currency.displayName}</option
		>
	{/each}
</select>
{#if selectedCurrency != 'Choose a currency'}
	<div transition:slide>
		<table>
			<thead>
				<th class="align_left narrow_column">Format Name</th>
				<th class="align_left wide_column">Format Code</th>
				<th class="align_left wide_column">Example Input</th>
				<th class="align_right wide_column">Example Output</th>
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
							class="align_left input_box"
						/>
					</td>
					<td class="align_right" in:blur|local>{formatExample(format)}</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}

<style lang="postcss">
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		padding: 0.35em;
		width: 100%;
		border: 1px solid var(--base-300);
		font-family: var(--ui-font-family);
		background: var(--base-200);
		margin: 0.5em 0 0 0;
		transition: all 400ms;
		cursor: pointer;
	}
	select:hover {
		@apply shadow-md;
		border: 1px solid var(--base-content);
		transition: all 400ms;
	}
	select:focus {
		outline: none;
	}

	table {
		font-size: 14px;
		border-collapse: collapse;
		/* Offset the cell padding to get the outside edges aligned w/ the parent */
		margin-left: -8px;
		width: calc(100% + 16px);
	}
	th {
		max-width: 1px;
		font-weight: 600;
		padding: 0px 8px;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	td {
		padding: 4px 8px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* tr:hover {
  background-color: rgb(247, 249, 250);
} */
	.align_left {
		text-align: left;
	}
	.align_right {
		text-align: right;
	}
	.wide_column {
		min-width: 120px;
	}
	.narrow_column {
		max-width: 60px;
	}
	.input_box {
		width: 100%;
	}

	input {
		box-sizing: border-box;
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--base-300);
		background: var(--base-200);
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-left: auto;
		width: 65%;
		padding: 0.35em;
		-webkit-appearance: none;
		-moz-appearance: none;
		vertical-align: middle;
		font-size: 12px;
	}
	input:required {
		box-shadow: none;
	}
	input:focus {
		outline: none;
	}
</style>
