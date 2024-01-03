<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import mermaid from 'mermaid';
	export let chart;
	/** @type {HTMLDivElement} */
	let wrapEl;
	/** @type {HTMLDivElement} */
	let container;

	// TODO: How to make ID work?
	let id = '';

	/**
	 *
	 * @param {string} content
	 */
	async function updateChart(content) {
		id = btoa(content).replaceAll('=', '');

		if (!content) {
			if (container) container.innerHTML = '';
			return;
		}

		const renderedChart = await mermaid.render('hi', content.trim());
		container.innerHTML = renderedChart.svg;
		renderedChart.bindFunctions?.(container);
	}

	$: updateChart(wrapEl?.textContent ?? chart);
</script>

{#if $$slots.default}
	<div class="invisible" bind:this={wrapEl}>
		<slot />
	</div>
{/if}

<div bind:this={container} id="container-{id}" />
