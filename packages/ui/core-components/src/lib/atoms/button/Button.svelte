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
	const enabledClass = 'transition-all duration-150 hover:brightness-105 active:brightness-95';
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
		flex items-center transition-colors rounded variant-{variant} {sizes[size]}
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
		/* TODO: These should have been moved to css vars, what are those vars? */
		&.variant-primary {
			--bg: var(--color-primary);
			--text: var(--color-primary-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-primary);
				--text: var(--color-primary);
				--hover-bg: var(--color-primary / 0.1); /* TODO: does this work? */
			}
		}

		&.variant-secondary {
			--bg: var(--color-base-300);
			--text: var(--color-base-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-base-300);
				--text: var(--color-base-300);
				--hover-bg: var(--color-base-300 / 0.1);
			}
		}

		&.variant-accent {
			--bg: var(--color-accent);
			--text: var(--color-accent-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-accent);
				--text: var(--color-accent);
				--hover-bg: var(--color-accent / 0.1);
			}
		}

		&.variant-info {
			--bg: var(--color-info);
			--text: var(--color-info-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-info);
				--text: var(--color-info);
				--hover-bg: var(--color-info / 0.1);
			}
		}

		&.variant-positive {
			--bg: var(--color-positive);
			--text: var(--color-positive-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-positive);
				--text: var(--color-positive);
				--hover-bg: var(--color-positive / 0.1);
			}
		}

		&.variant-warning {
			--bg: var(--color-warning);
			--text: var(--color-warning-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-warning);
				--text: var(--color-warning);
				--hover-bg: var(--color-warning / 0.1);
			}
		}

		&.variant-negative {
			--bg: var(--color-negative);
			--text: var(--color-negative-content);
			&.outlined {
				--bg: transparent;
				--border: var(--color-negative);
				--text: var(--color-negative);
				--hover-bg: var(--color-negative / 0.1);
			}
		}
	}
</style>
