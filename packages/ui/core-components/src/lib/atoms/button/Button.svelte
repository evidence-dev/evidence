<script context="module">
	export const evidenceInclude = true;

	/** @typedef {"sm" | "md" | "base" | "lg"} ButtonSize */
	/** @typedef {"primary" | "secondary" | "accent" | "info" | "success" | "warn" | "error"} ButtonVariant */
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
		&.variant-primary {
			--bg: theme(colors.primary);
			--text: theme(colors.primary-content);
			&.outlined {
				--border: theme(colors.primary);
				--text: theme(colors.primary);
				--hover-bg: theme(colors.primary / 0.1);
			}
		}

		&.variant-secondary {
			--bg: theme(colors.base-300);
			--text: theme(colors.base-content);
			&.outlined {
				--border: theme(colors.base-300);
				--text: theme(colors.base-300);
				--hover-bg: theme(colors.base-300 / 0.1);
			}
		}

		&.variant-accent {
			--bg: theme(colors.accent);
			--text: theme(colors.accent-content);
			&.outlined {
				--border: theme(colors.accent);
				--text: theme(colors.accent);
				--hover-bg: theme(colors.accent / 0.1);
			}
		}

		&.variant-info {
			--bg: theme(colors.info);
			--text: theme(colors.info-content);
			&.outlined {
				--border: theme(colors.info);
				--text: theme(colors.info);
				--hover-bg: theme(colors.info / 0.1);
			}
		}

		&.variant-success {
			--bg: theme(colors.positive);
			--text: theme(colors.positive-content);
			&.outlined {
				--border: theme(colors.positive);
				--text: theme(colors.positive);
				--hover-bg: theme(colors.positive / 0.1);
			}
		}

		&.variant-warn {
			--bg: theme(colors.warning);
			--text: theme(colors.warning-content);
			&.outlined {
				--border: theme(colors.warning);
				--text: theme(colors.warning);
				--hover-bg: theme(colors.warning / 0.1);
			}
		}

		&.variant-error {
			--bg: theme(colors.negative);
			--text: theme(colors.negative-content);
			&.outlined {
				--border: theme(colors.negative);
				--text: theme(colors.negative);
				--hover-bg: theme(colors.negative / 0.1);
			}
		}

		@apply bg-[var(--bg)] border-[var(--border)] text-[var(--text)];

		&.outlined {
			@apply bg-transparent border;
			&:not(:disabled) {
				@apply hover:bg-[var(--hover-bg)];
			}
		}

		&:disabled {
			@apply cursor-not-allowed saturate-50 opacity-50;
		}
		&:not(:disabled) {
			@apply transition-all duration-150 hover:brightness-105 active:brightness-95;
		}
	}
</style>
