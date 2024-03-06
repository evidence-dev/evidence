import { tv } from 'tailwind-variants';

export { default as Badge } from './badge.svelte';
export const badgeVariants = tv({
	base: 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 select-none',
	variants: {
		variant: {
			default: 'border-transparent bg-gray-900 text-white shadow hover:bg-gray-900/80',
			secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
			destructive: 'border-transparent bg-red-500 text-red-50 shadow hover:bg-red-500/80',
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
