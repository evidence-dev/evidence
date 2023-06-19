<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import eChartsCopy from '@evidence-dev/component-utilities/echartsCopy';

	export let config = undefined;
	export let height = '291px';
	export let width = '100%';
	export let copying = false;
	export let printing = false;
</script>

{#if copying || printing}
	<div
		class="chart"
		style="
          height: {height};
          width: {width};
          margin-left: 0;
          margin-top: 15px;
          margin-bottom: 10px;
          overflow: visible;
          break-inside: avoid;
      "
		use:eChartsCopy={{ config, ratio: printing ? 4 : 2 }}
	/>
{/if}
