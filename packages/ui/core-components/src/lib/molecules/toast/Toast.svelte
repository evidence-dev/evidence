<script context="module">
	const DEPRECATED_STATUS_MAP = /** @type {const} */ ({
		error: 'negative',
		success: 'positive'
	});

	const isDeprecatedStatus = (status) => Object.keys(DEPRECATED_STATUS_MAP).includes(status);

	const checkDeprecatedStatus = (status) => {
		if (isDeprecatedStatus(status)) {
			console.warn(
				`[Toast] The status "${status}" is deprecated. Please use "${DEPRECATED_STATUS_MAP[status]}" instead.`
			);
			return DEPRECATED_STATUS_MAP[status];
		}
		return status;
	};

	const classLookup = {
		negative: 'border-negative/50 bg-negative/10 text-negative-content',
		positive: 'border-positive/50 bg-positive/10 text-positive-content',
		info: 'border-info/50 bg-info/10 text-info-content',
		warning: 'border-warning/50 bg-warning/10 text-warning-content'
	};
</script>

<script>
	import { createEventDispatcher } from 'svelte';
	import { scale, fly } from 'svelte/transition';

	export let id;
	/** @type {import("@evidence-dev/component-utilities/stores).ToastStatus } */
	export let status = 'info';
	$: status = checkDeprecatedStatus(status);
	export let title;
	export let message;
	export let dismissable = true;
	const dispatch = createEventDispatcher();

	const dismiss = () => {
		if (dismissable) dispatch('dismiss', { id });
	};
</script>

<div
	role="none"
	class="print:hidden rounded py-1 px-3 my-4 mx-0 shadow-md text-xs font-mono flex justify-between transition-all duration-300 border
	{status ? classLookup[status] : ''}"
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
