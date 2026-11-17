import { cn } from '../../shadcn/utils';

// Same rhythm as the dev platform sidebar (28px rows, 1px apart); groups are separated by space, not lines.
const rowBase =
	'group mb-px flex h-7 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-[13px] outline-none transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

export function navItemClass(isActive = false, extra?: string) {
	return cn(
		rowBase,
		'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
		isActive && 'bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.06]',
		extra
	);
}

// Folders toggle in place; same row as a page, with the chevron at the end.
export function folderRowClass(extra?: string) {
	return cn(rowBase, 'text-muted-foreground hover:text-foreground', extra);
}

// Project labels, only when an org has several projects: small, muted headings.
export function sectionLabelClass(extra?: string) {
	return cn(
		rowBase,
		'h-6 font-mono text-[10.5px] tracking-wider uppercase text-muted-foreground/80 hover:text-foreground',
		extra
	);
}
