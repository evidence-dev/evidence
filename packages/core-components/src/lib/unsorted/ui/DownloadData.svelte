<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { ExportToCsv } from 'export-to-csv';
	import { fade } from 'svelte/transition';

	export let data;
	export let queryID;
	export let text = 'Download';
	export let display;

	export let downloadData = (data) => {
		const options = {
			fieldSeparator: ',',
			quoteStrings: '"',
			decimalSeparator: '.',
			showLabels: true,
			showTitle: false,
			filename: queryID ?? 'evidence_download',
			useTextFile: false,
			useBom: true,
			useKeysAsHeaders: true
		};

		const data_copy = JSON.parse(JSON.stringify(data));

		const csvExporter = new ExportToCsv(options);

		csvExporter.generateCsv(data_copy);
	};
</script>

{#if display}
	<div transition:fade|local={{ duration: 200 }}>
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
		stroke: var(--grey-400);
		margin-top: auto;
		margin-bottom: auto;
		transition: stroke 200ms;
	}

	button {
		display: flex;
		cursor: pointer;
		font-family: var(--ui-font-family);
		font-size: 1em;
		color: var(--grey-400);
		justify-items: flex-end;
		align-items: baseline;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0 5px;
		gap: 3px;
		transition: color 200ms;
		-moz-user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
		-o-user-select: none;
		user-select: none;
	}

	button:hover {
		color: var(--blue-600);
		transition: color 200ms;
	}

	button:hover :global(svg) {
		stroke: var(--blue-600);
		transition: stroke 200ms;
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
