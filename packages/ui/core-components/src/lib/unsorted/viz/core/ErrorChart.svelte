<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	/** @type {Error} */
	export let error;
	/** @type {string} */
	export let title;
	/** @type {string} */
	export let minHeight = '150';
</script>

<div
	width="100%"
	class="grid grid-rows-auto grid-cols-1 justify-center relative
			bg-negative/10 text-negative
			font-ui font-normal
			rounded border border-negative/50
			min-h-[{minHeight}px]
			py-5 px-8 my-5
			print:break-inside-avoid"
>
	<div class="m-auto w-full">
		<div class="font-bold text-center text-lg">
			{title}
		</div>
		<div class="w-full [word-wrap:break-work] text-xs">
			<pre class="text-left mx-auto w-fit select-text">{error}</pre>
		</div>
	</div>
</div>
