<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	/** @type {Error} */
	export let error;
	/** @type {string} */
	export let title;
	/** @type {string} */
	export let height = '340';
</script>

<div
	width="100%"
	class="grid grid-rows-auto grid-cols-1 justify-center relative
			bg-negative/10 text-negative
			font-ui font-normal
			rounded border border-negative/50
			min-h-[200px]
			h-[{height}px]
			py-5 px-8 mt-2 mb-4
			print:break-inside-avoid"
>
	<div class="m-auto w-full">
		<div class="font-bold text-center text-lg">
			{title}
		</div>
		<div class="w-full [word-wrap:break-work] text-xs">
			<pre class="text-left font-sans mx-auto w-fit select-text text-wrap">{error}</pre>
		</div>
	</div>
</div>
