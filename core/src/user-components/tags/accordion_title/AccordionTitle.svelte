<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { ACCORDION_TITLE_DEFAULT_PADDING_PX } from './schema';
	import {
		ACCORDION_ITEM_SLOT_CONTEXT_KEY,
		type AccordionItemSlotContext
	} from '../accordion_item/slot-context';

	let props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children as Snippet | undefined);
	const paddingTop = $derived(props.padding_top ?? ACCORDION_TITLE_DEFAULT_PADDING_PX);
	const paddingBottom = $derived(props.padding_bottom ?? ACCORDION_TITLE_DEFAULT_PADDING_PX);

	const ctx = getContext<AccordionItemSlotContext | undefined>(ACCORDION_ITEM_SLOT_CONTEXT_KEY);

	$effect(() => {
		if (!ctx) return;
		ctx.setTitle(children ?? null, { top: paddingTop, bottom: paddingBottom });
	});

	onMount(() => () => ctx?.setTitle(null));
</script>

<!-- Renders nothing directly; children are rendered by the parent AccordionItem in the accordion trigger. -->
