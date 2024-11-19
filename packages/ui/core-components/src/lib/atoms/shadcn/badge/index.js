import { tv } from 'tailwind-variants';

export { default as Badge } from './badge.svelte';
export const badgeVariants = tv({
	base: 'inline-flex items-center rounded-md border border-base-300 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-base-content-muted focus:ring-offset-2 select-none',
	variants: {
		variant: {
			default: 'border-transparent bg-primary text-primary-content shadow hover:bg-primary/80',
			secondary: 'border-transparent bg-base-200 hover:bg-base-200/80',
			destructive:
				'border-transparent bg-negative text-negative-content shadow hover:bg-negative/80',
			outline: 'text-foreground'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

/**
 * @typedef {'default' | 'secondary' | 'destructive' | 'outline'} Variant
 */
