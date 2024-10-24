<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircle } from '@steeze-ui/tabler-icons';

	/** @type {import('@steeze-ui/svelte-icon').IconSource} */
	export let icon = InfoCircle;

	/** @type {"sm" | "md" | "lg"}*/
	export let maxWidth = undefined;

	/** @type {"right" | "left"} */
	export let direction = 'right';

	let visible = false;

	const showMessage = () => (visible = true);
	const hideMessage = () => (visible = false);
</script>

<span
	on:focus={showMessage}
	on:blur={hideMessage}
	on:mouseenter={showMessage}
	on:mouseleave={hideMessage}
	class="inline-block align-middle leading-4 cursor-help relative w-fit"
	role="tooltip"
>
	<slot name="handle">
		<Icon src={icon} class="w-5 h-5" />
	</slot>

	{#if visible}
		<span
			transition:fade
			class="text-sm bg-base-200 border border-base-300 rounded py-1 px-2 absolute -top-[5%] z-50 min-w-min w-max"
			class:left-[115%]={direction === 'right'}
			class:right-[115%]={direction === 'left'}
			class:max-w-sm={maxWidth === 'sm'}
			class:max-w-md={maxWidth === 'md'}
			class:max-w-lg={maxWidth === 'lg'}
			class:max-w-[200px]={maxWidth !== 'sm' && maxWidth !== 'md' && maxWidth !== 'lg'}
		>
			<slot />
		</span>
	{/if}
</span>
