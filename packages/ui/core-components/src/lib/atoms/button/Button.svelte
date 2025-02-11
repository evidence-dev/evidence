<script context="module">
	/** @typedef {"default" | "sm" | "lg" | "xl"} ButtonSize */
	/** @typedef {"default" | "primary" | "destructive" | "muted" | "ghost" | "link"} ButtonVariant */
	/** @typedef {"left" | "right"} ButtonIconPosition */
</script>

<script>
	import { tv } from 'tailwind-variants';
	import { Icon } from '@steeze-ui/svelte-icon';
	/** @type {import("@steeze-ui/svelte-icon").IconSource | undefined} */
	export let icon = undefined;

	/** @type {ButtonIconPosition} */
	export let iconPosition = 'right';

	/** @type {ButtonSize} */
	export let size = 'default';

	/** @type {ButtonVariant} */
	export let variant = 'default';

	/** @type {boolean} */
	export let disabled = false;

	/** @type {string | undefined} */
	export let formaction = undefined;

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };

	/** @type {HTMLButtonAttributes["type"]} */
	let _type = 'button';
	export { _type as type };

	$: if (formaction) _type = 'submit';

	const buttonVariants = tv({
		base: 'inline-flex items-center justify-center rounded-md text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-300 disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				default: 'bg-base-100 border shadow-sm hover:bg-base-200 active:bg-base-300',
				primary:
					'bg-primary text-primary-content shadow-sm hover:bg-primary/90  active:bg-primary/80',
				destructive:
					'bg-negative text-negative-content shadow-sm hover:bg-negative/90 active:bg-negative/80',
				muted: 'bg-base-200 text-base-content hover:bg-base-300 active:bg-base-300/80',
				ghost: 'hover:bg-base-200 hover:text-base-content',
				link: 'text-base-content underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-8 px-3',
				lg: 'h-8 px-10',
				xl: 'h-10 px-10 text-sm'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	const iconVariants = tv({
		variants: {
			variant: {
				default: 'stroke-base-content',
				primary: 'stroke-primary-content',
				destructive: 'stroke-negative-content',
				muted: 'stroke-base-content',
				ghost: 'stroke-base-content',
				link: 'stroke-base-content'
			},
			size: {
				default: 'h-4 w-4',
				lg: 'h-4 w-4',
				xl: 'h-5 w-5'
			},
			iconPosition: {
				left: 'mr-2',
				right: 'ml-2'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			iconPosition: 'left'
		}
	});
</script>

<button
	type={_type}
	{disabled}
	{formaction}
	on:click|stopPropagation
	class={buttonVariants({ variant, size, className })}
>
	{#if iconPosition === 'left' && icon}
		<Icon src={icon} class={iconVariants({ variant, size, iconPosition })} />
	{/if}
	<slot />
	{#if iconPosition === 'right' && icon}
		<Icon src={icon} class={iconVariants({ variant, size, iconPosition })} />
	{/if}
</button>
