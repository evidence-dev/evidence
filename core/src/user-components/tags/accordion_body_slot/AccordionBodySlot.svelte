<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import {
		ACCORDION_ITEM_SLOT_CONTEXT_KEY,
		type AccordionItemSlotContext
	} from '../accordion_item/slot-context';

	let props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children as Snippet | undefined);

	const ctx = getContext<AccordionItemSlotContext | undefined>(ACCORDION_ITEM_SLOT_CONTEXT_KEY);

	$effect(() => {
		if (!ctx) return;
		ctx.setBody(children ?? null);
	});

	onMount(() => () => ctx?.setBody(null));
</script>

<!-- Renders nothing directly; children are rendered by the parent AccordionItem in the accordion content. -->
