<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircle } from '@steeze-ui/tabler-icons';

	/** @type {import("@steeze-ui/svelte-icon").IconSource} */
	export let icon = InfoCircle;

	let visible = false;

	const showMessage = () => (visible = true);
	const hideMessage = () => (visible = false);
</script>

<span
	on:focus={showMessage}
	on:blur={hideMessage}
	on:mouseenter={showMessage}
	on:mouseleave={hideMessage}
	class="additional-info-icon"
>
	<Icon src={icon} class="w-6 h-6" />

	{#if visible}
		<span transition:fade class="info-msg">
			<slot />
		</span>
	{/if}
</span>

<style scoped>
	span.additional-info-icon {
		width: 18px;
		color: var(--grey-600);
		display: inline-block;
		vertical-align: middle;
		line-height: 1em;
		cursor: help;
		position: relative;
		text-transform: none;
	}

	.info-msg {
		@apply text-sm text-white bg-gray-900/90 rounded py-1 px-2 absolute -top-[5%] left-[115%] z-50 min-w-[200px] max-w-sm;
	}
</style>
