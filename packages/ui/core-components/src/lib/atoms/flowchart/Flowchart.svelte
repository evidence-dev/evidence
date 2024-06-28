<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount } from 'svelte';
	import mermaid from 'mermaid';
	import { chartColours } from '@evidence-dev/component-utilities/colours';

	/** @type {string} */
	export let chart = undefined;

	/** @type {HTMLDivElement} */
	let wrapEl;

	/** @type {HTMLDivElement} */
	let container;

	/** @type {string} */
	let chartSpec;

	/**
	 * @param {string} c
	 */
	async function updateChart(c) {
		if (!container) return;
		container.innerHTML = c;
		await mermaid.run({
			nodes: [container]
		});
	}

	$: chartSpec = wrapEl?.textContent ?? chart;
	$: updateChart(chartSpec);
	onMount(() => {
		// This breaks when using the slot method
		if (chart) updateChart(chartSpec);
	});
		// set default mermaid config
		mermaid.initialize({
		startOnLoad: false,
		theme: 'base',
		themeVariables: {
			primaryColor: chartColours[2],
			primaryBorderColor: chartColours[0],
			fontFamily: 'Inter',
			edgeLabelBackground: '#ffffffff'
		}
	});
</script>

{#if $$slots.default}
	<div class="invisible" bind:this={wrapEl}>
		<slot />
	</div>
{/if}

<div bind:this={container} class="mb-4">
	{chartSpec}
</div>
