<script context="module">
	export const evidenceInclude = true;

	/** @typedef {"sm" | "base" | "lg"} ButtonSize */
	/** @typedef {"info" | "success" | "warn" | "error"} ButtonVariant */
	/** @typedef {"left" | "right"} ButtonIconPosition */
	/** @typedef {boolean} ButtonOutline */

	/**
	 * @type {Record<ButtonOutline, Record<ButtonVariant, string>>}
	 * Lookup for the available styles for a button
	 * We have to do it this way so tailwind can statically analyze the file
	 */
	const colors = {
		// Outlined
		/** @type {Record<ButtonVariant, string>}*/
		[true]: {
			info: 'border border-blue-700 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-800 active:text-blue-900 active:border-blue-900',
			warn: 'border border-yellow-700 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-800 active:text-yellow-900 active:border-yellow-900',
			error:
				'border border-red-700 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-800 active:text-red-900 active:border-red-900',
			success:
				'border border-green-700 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-800 active:text-green-900 active:border-green-900'
		},
		// Not Outlined
		/** @type {Record<ButtonVariant, string>}*/
		[false]: {
			info: 'bg-blue-600 text-white hover:bg-blue-700 active:hover:bg-blue-800',
			warn: 'bg-yellow-600 text-white hover:bg-yellow-700 active:hover:bg-yellow-800',
			error: 'bg-red-600 text-white hover:bg-red-700 active:hover:bg-red-800',
			success: 'bg-green-600 text-white hover:bg-green-700 active:hover:bg-green-800'
		}
	};

	/** @type {Record<ButtonSize, string>}*/
	const sizes = {
		base: 'px-2 py-1 mx-1 gap-2',
		sm: 'px-1 py-0.5 mx-0.5 gap-1 text-xs',
		lg: 'px-4 py-2 mx-2 gap-4'
	};

	/** @type {Record<ButtonSize, string>}*/
	const iconSize = {
		base: 'w-4',
		sm: 'w-3',
		lg: 'w-5'
	};
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	/** @type {import("@steeze-ui/svelte-icon").IconSource | undefined} */
	export let icon = undefined;

	/** @type {ButtonIconPosition} */
	export let iconPosition = 'right';

	/** @type {ButtonSize} */
	export let size = 'base';

	/** @type {ButtonVariant} */
	export let variant = 'info';

	/** @type {boolean} */
	export let outline = false;
</script>

<button
	type="button"
	on:click|stopPropagation
	class="flex items-center {colors[outline][variant]} {sizes[size]} transition-colors rounded"
>
	{#if iconPosition === 'left' && icon}
		<Icon src={icon} class={iconSize[size]} />
	{/if}
	<slot />
	{#if iconPosition === 'right' && icon}
		<Icon src={icon} class={iconSize[size]} />
	{/if}
</button>

<style lang="postcss">
</style>
