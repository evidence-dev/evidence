<script context="module">
	export const evidenceInclude = true;

	/** @typedef {"sm" | "md" | "base" | "lg"} ButtonSize */
	/** @typedef {"primary" | "secondary" | "accent" | "info" | "positive" | "warning" | "negative"} ButtonVariant */
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

	const DEPRECATED_VARIANTS_MAP = /** @type {const} */ ({
		success: 'positive',
		warn: 'warning',
		error: 'negative'
	});

	const isDeprecatedVariant = (variant) => DEPRECATED_VARIANTS_MAP[variant] !== undefined;

	const checkDeprecatedVariant = (variant) => {
		if (isDeprecatedVariant(variant)) {
			console.warn(
				`The variant "${variant}" is deprecated. Please use "${DEPRECATED_VARIANTS_MAP[variant]}" instead.`
			);
			return DEPRECATED_VARIANTS_MAP[variant];
		}
		return variant;
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
	$: variant = checkDeprecatedVariant(variant);

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

	const disabledClass = 'cursor-not-allowed saturate-50 opacity-50';
	const enabledClass =
		'cursor-pointer transition-all duration-150 hover:brightness-105 active:brightness-95';
</script>

<button
	type={_type}
	{disabled}
	{formaction}
	class:outlined={outline}
	class:border={outline}
	on:click|stopPropagation
	class="
	 	bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover-bg)]
		{disabled ? disabledClass : enabledClass}
		flex items-center transition-colors rounded-sm variant-{variant} {sizes[size]}
	"
>
	{#if iconPosition === 'left' && icon}
		<Icon src={icon} class={iconSizes[iconSize]} />
	{/if}
	<slot />
	{#if iconPosition === 'right' && icon}
		<Icon src={icon} class={iconSizes[iconSize]} />
	{/if}
</button>

<style>
	button {
		--bg: var(--primary);
		--hover-bg: rgb(from var(--primary) r g b / 90%);
		--text: var(--secondary);
		&.variant-primary {
			--primary: var(--color-primary);
			--secondary: var(--color-primary-content);
		}
		&.variant-secondary {
			--primary: var(--color-base-300);
			--secondary: var(--color-base-content);
		}
		&.variant-accent {
			--primary: var(--color-accent);
			--secondary: var(--color-accent-content);
		}
		&.variant-info {
			--primary: var(--color-info);
			--secondary: var(--color-info-content);
		}
		&.variant-positive {
			--primary: var(--color-positive);
			--secondary: var(--color-positive-content);
		}
		&.variant-warning {
			--primary: var(--color-warning);
			--secondary: var(--color-warning-content);
		}
		&.variant-negative {
			--primary: var(--color-negative);
			--secondary: var(--color-negative-content);
		}
		&.outlined {
			--border: var(--primary);
			--text: var(--primary);
			--hover-bg: rgb(from var(--primary) r g b / 10%);
			--bg: transparent;
		}
	}
</style>
