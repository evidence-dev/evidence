<script>
	import { onMount } from 'svelte';
	/** @type {string | undefined} */
	export let inputType = undefined;
	/** @type {[string] | undefined} */
	export let error = undefined;
	/** @type {string} */
	export let height = '';
	/** @type {string} */
	export let width = '';

	onMount(() => {
		console.error(`Error in ${inputType}: ${error}`);
	});

	if (error.length > 0) {
		error = error.join('\n');
	}
</script>

<div
	style="height: {height}px; width: {width}px"
	class="group relative cursor-help cursor-helpfont-sans bg-negative/10 font-ui font-normal rounded border border-negative/50 print:break-inside-avoid text-center text-negative flex items-center justify-center mb-4 mt-4"
>
	<div>
		<span class="text-center [word-wrap:break-work] w-full font-bold text-sm">Error:</span>
		<span class="font-medium text-center text-sm">{inputType}</span>
	</div>
	<div
		class="hidden font-sans group-hover:inline-block absolute top-[50%] left-[50%] text-xs px-2 py-1 bg-base-100 border border-base-300 leading-relaxed rounded-md text-left z-50 w-fit"
	>
		<pre>{error}</pre>
	</div>
</div>
