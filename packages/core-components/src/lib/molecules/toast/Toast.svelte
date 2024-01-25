<script>
	import { createEventDispatcher } from 'svelte';
	import { scale, fly } from 'svelte/transition';

	export let id;
	/** @type {import("@evidence-dev/component-utilities/stores).ToastStatus } */
	export let status = 'info';
	export let title;
	export let message;
	export let dismissable = true;
	const dispatch = createEventDispatcher();

	const dismiss = () => {
		if (dismissable) dispatch('dismiss', { id });
	};
</script>

<div
	class="print:hidden rounded py-1 px-3 my-4 mx-0 shadow-md text-xs font-mono flex justify-between transition-all duration-300 border {status ??
		''}"
	in:scale
	out:fly|local={{ x: 1000, duration: 1000, delay: 0, opacity: 0.8 }}
	on:click={dismiss}
	on:keypress={dismiss}
>
	{#if title}
		<span class="cursor-pointer font-bold pr-8 flex items-center">{title}</span>
	{/if}
	<span class="cursor-pointer">{message}</span>
</div>

<style lang="postcss">
	.error {
		@apply border-error-200 bg-error-50 text-error-800;
	}

	.warning {
		@apply border-warning-200 bg-warning-50 text-warning-800;
	}

	.success {
		@apply border-success-200 bg-success-50 text-success-800;
	}

	.info {
		@apply border-gray-200 bg-white text-gray-800;
	}
</style>
