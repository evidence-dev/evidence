import { tv } from 'tailwind-variants';
import { buttonVariants } from '../../shadcn/components/ui/button';

// Extend the shadcn buttonVariants to allow for future overrides
const baseVariants = tv({
	extend: buttonVariants,
	base: 'cursor-pointer',
	variants: {
		variant: {
			link: 'text-primary hover:text-primary/80'
		}
	}
});

// Create a function that maps our variant names to shadcn names and allows overrides
export function userControlledButtonVariants({
	variant = 'default',
	size = 'default',
	...props
}: {
	variant?: 'default' | 'primary' | 'destructive' | 'secondary' | 'ghost' | 'link';
	size?: 'default' | 'sm' | 'lg' | 'icon';
	className?: string;
}) {
	// Map our variant names to shadcn variant names
	const variantMap = {
		default: 'outline',
		primary: 'default',
		destructive: 'destructive',
		secondary: 'secondary',
		ghost: 'ghost',
		link: 'link'
	} as const;

	const mappedVariant = variantMap[variant];

	// Call the base buttonVariants with mapped names
	return baseVariants({ variant: mappedVariant, size, ...props });
}

export type UserControlledButtonVariant =
	| 'default'
	| 'primary'
	| 'destructive'
	| 'secondary'
	| 'ghost'
	| 'link';
export type UserControlledButtonSize = 'default' | 'sm' | 'lg' | 'icon';
