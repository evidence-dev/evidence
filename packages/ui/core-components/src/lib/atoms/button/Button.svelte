<script context="module">
	export const evidenceInclude = true;

	/** @typedef {"sm" | "md" | "base" | "lg"} ButtonSize */
	/** @typedef {"info" | "success" | "warn" | "error"} ButtonVariant */
	/** @typedef {"left" | "right"} ButtonIconPosition */
	/** @typedef {boolean} ButtonOutline */

	/** @type {Record<ButtonSize, string>}*/
	const sizes = {
		base: 'px-2 py-1 mx-1 gap-2',
		md: 'px-2 py-1 mx-1 gap-2 text-xs',
		sm: 'px-1 py-0.5 mx-0.5 gap-1 text-xs',
		lg: 'px-4 py-2 mx-2 gap-4'
	};

	/** @type {Record<ButtonSize, string>}*/
	const iconSizes = {
		base: 'w-4',
		md: 'w-4',
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

	/** @type {ButtonSize} */
	export let iconSize = size;

	/** @type {ButtonVariant} */
	export let variant = 'info';

	/** @type {boolean} */
	export let outline = false;

	/** @type {boolean} */
	export let disabled = false;

	/** @type {string | undefined} */
	export let formaction = undefined;

	/** @type {HTMLButtonAttributes["type"]} */
	let _type = 'button';
	export { _type as type };

	$: if (formaction) _type = 'submit';
</script>

<button
	type={_type}
	{disabled}
	{formaction}
	on:click|stopPropagation
	class:outlined={outline}
	class="flex items-center transition-colors rounded variant-{variant} {sizes[size]}"
>
	{#if iconPosition === 'left' && icon}
		<Icon src={icon} class={iconSizes[iconSize]} />
	{/if}
	<slot />
	{#if iconPosition === 'right' && icon}
		<Icon src={icon} class={iconSizes[iconSize]} />
	{/if}
</button>

<style lang="postcss">
	button {
		@apply disabled:cursor-default enabled:cursor-pointer;

		&.variant-info {
			@apply text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-500/10 border-blue-800 dark:border-blue-800;
		}
		&.variant-warn {
			@apply text-yellow-800 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-800 dark:border-yellow-800;
		}
		&.variant-success {
			@apply text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-500/10 border-green-800 dark:border-green-800;
		}
		&.variant-error {
			@apply text-destructive bg-destructive/10 dark:text-red-100 dark:bg-red-500/10 border-red-800 dark:border-red-800;
		}

		&.outlined {
			@apply bg-transparent border enabled:hover:bg-opacity-20 enabled:active:bg-opacity-30
				disabled:border-opacity-40 disabled:text-opacity-40;
		}

		&:not(.outlined) {
			@apply text-white border-transparent
				enabled:hover:bg-opacity-90 enabled:active:bg-opacity-100
				disabled:bg-opacity-40 disabled:text-opacity-40;
		}
	}
</style>
