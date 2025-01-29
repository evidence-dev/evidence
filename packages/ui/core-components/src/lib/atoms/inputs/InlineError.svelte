<script>
	import { onMount } from 'svelte';
	import { InfoCircle as CalendarIcon } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

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

	//ensure error is an array
	if (!Array.isArray(error)) {
		error = [error];
	}

	if (error.length > 0) {
		error = error.join('\n');
	}
</script>

<div
	style="height: {height}px; width: {width}px"
	class="group relative cursor-help cursor-helpfont-sans bg-negative/10 font-ui font-normal rounded border border-negative/50 print:break-inside-avoid text-center text-negative flex items-center justify-center mb-4 mt-4"
>
	<div>
		<Icon src={InfoCircle} class="mb-[2px] h-4 w-4 stroke-[1.8px] text-negative inline" />
		<span class="font-medium text-center text-sm">{inputType}</span>
	</div>
	<div
		class="hidden font-sans group-hover:inline-block absolute top-[50%] left-[50%] text-xs px-2 py-1 bg-base-100 border border-base-300 leading-relaxed rounded-md text-left z-50 w-fit"
	>
		<pre>{error}</pre>
	</div>
</div>
