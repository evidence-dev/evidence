<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { ExportToCsv } from 'export-to-csv';
	import { fade } from 'svelte/transition';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import InlineError from '../../atoms/inputs/InlineError.svelte';
	import { toBoolean } from '$lib/utils.js';

	export let data = undefined;
	export let queryID = undefined;
	export let text = 'Download';
	export let display = true;
	$: display = toBoolean(display);
	let errors = [];

	const date = new Date();
	const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 19)
		.replaceAll(':', '-');

	export let downloadData = (data) => {
		try {
			checkInputs(data);
		} catch (e) {
			errors = [...errors, e.message];
			return;
		}
		const options = {
			fieldSeparator: ',',
			quoteStrings: '"',
			decimalSeparator: '.',
			showLabels: true,
			showTitle: false,
			filename: (queryID ?? 'evidence_download') + ` ${localISOTime}`,
			useTextFile: false,
			useBom: true,
			useKeysAsHeaders: true
		};

		const data_copy = JSON.parse(JSON.stringify(Array.from(data)));

		const csvExporter = new ExportToCsv(options);

		csvExporter.generateCsv(data_copy);
	};
</script>

{#if errors.length > 0}
	<InlineError inputType="DownloadData" height="32" width="160" error={errors} />
{:else if display}
	<div transition:fade|local={errors.length > 0 ? { duration: 0 } : { duration: 200 }}>
		<button type="button" aria-label={text} class={$$props.class} on:click={downloadData(data)}>
			<span>{text}</span>
			<slot>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5" /></svg
				>
			</slot>
		</button>
	</div>
{/if}

<style>
	button :global(svg) {
		stroke: var(--base-content);
		margin-top: auto;
		margin-bottom: auto;
		transition: stroke 200ms;
	}

	button {
		display: flex;
		cursor: pointer;
		font-family: var(--ui-font-family);
		font-size: 1em;
		color: var(--base-content);
		opacity: 0.5;
		justify-items: flex-end;
		align-items: baseline;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0 5px;
		gap: 3px;
		transition: all 200ms;
		-moz-user-select: none;
		-webkit-user-select: none;
		-o-user-select: none;
		user-select: none;
	}

	button:hover {
		opacity: 1;
		color: var(--primary);
		transition: all 200ms;
	}

	button:hover :global(svg) {
		stroke: var(--primary);
		transition: all 200ms;
	}

	@media (max-width: 600px) {
		button {
			display: none;
		}
	}

	@media print {
		button {
			display: none;
		}
	}
</style>
