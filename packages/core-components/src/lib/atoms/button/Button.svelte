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
	/* 
		Colors are handled here because of the amount of permutations between outlined, variant, and disabled states

		There is probably room to clean this up; but right now it works
	*/
	button {
		&.variant-info {
			--100: theme(colors.blue.100);
			--400: theme(colors.blue.400);
			--500: theme(colors.blue.500);
			--600: theme(colors.blue.600);
			--700: theme(colors.blue.700);
			--800: theme(colors.blue.800);
			--900: theme(colors.blue.900);
		}
		&.variant-warn {
			--100: theme(colors.yellow.100);
			--400: theme(colors.yellow.400);
			--500: theme(colors.yellow.500);
			--600: theme(colors.yellow.600);
			--700: theme(colors.yellow.700);
			--800: theme(colors.yellow.800);
			--900: theme(colors.yellow.900);
		}
		&.variant-success {
			--100: theme(colors.green.100);
			--400: theme(colors.green.400);
			--500: theme(colors.green.500);
			--600: theme(colors.green.600);
			--700: theme(colors.green.700);
			--800: theme(colors.green.800);
			--900: theme(colors.green.900);
		}
		&.variant-error {
			--100: theme(colors.red.100);
			--400: theme(colors.red.400);
			--500: theme(colors.red.500);
			--600: theme(colors.red.600);
			--700: theme(colors.red.700);
			--800: theme(colors.red.800);
			--900: theme(colors.red.900);
		}

		@apply disabled:cursor-default enabled:cursor-pointer;

		&.outlined {
			@apply border border-[var(--700)] text-[var(--700)] enabled:hover:bg-[var(--100)] enabled:hover:text-[var(--800)] enabled:hover:border-[var(--800)] enabled:active:text-[var(--900)] enabled:active:border-[var(--900)]
					disabled:border-[var(--400)] disabled:text-[var(--400)];
		}

		&:not(.outlined) {
			@apply bg-[var(--600)] text-white enabled:hover:bg-[var(--700)] enabled:active:bg-[var(--800)] border border-transparent disabled:bg-[var(--400)];
		}
	}
</style>
