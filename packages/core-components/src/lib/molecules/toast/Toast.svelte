<script>
	import { scale, fly } from 'svelte/transition';

	/** @type {import("@evidence-dev/component-utilities/stores).ToastStatus } */
	export let status = 'info';
	export let title;
	export let message;
</script>

<div
	class="print:hidden rounded py-1 px-3 my-4 mx-0 shadow-md text-xs font-mono flex justify-between transition-all duration-300 border {status ??
		''}"
	in:scale
	out:fly|local={{ x: 1000, duration: 1000, delay: 0, opacity: 0.8 }}
>
	{#if title}
		<span class="cursor-pointer font-bold pr-8 flex items-center">{title}</span>
	{/if}
	<span class="cursor-pointer">{message}</span>
</div>

<style lang="postcss">
	.error {
		@apply border-red-200 bg-red-50 text-red-800;
	}

	.warning {
		@apply border-yellow-200 bg-yellow-50 text-yellow-800;
	}

	.success {
		@apply border-green-200 bg-green-50 text-green-800;
	}

	.info {
		@apply border-gray-200 bg-white text-gray-800;
	}
</style>
