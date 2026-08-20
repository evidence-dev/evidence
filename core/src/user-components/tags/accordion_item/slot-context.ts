import type { Snippet } from 'svelte';

export type AccordionTitlePadding = {
	/** Top padding in pixels */
	top: number;
	/** Bottom padding in pixels */
	bottom: number;
};

export type AccordionItemSlotContext = {
	setTitle: (snippet: Snippet | null, padding?: AccordionTitlePadding) => void;
	setBody: (snippet: Snippet | null) => void;
};

export const ACCORDION_ITEM_SLOT_CONTEXT_KEY = 'accordion-item-slots';
