<script lang="ts">
	import * as Dialog from '../../../shadcn/components/ui/dialog/index.js';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import XIcon from 'lucide-svelte/icons/x';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		title?: string;
		subtitle?: string;
		info?: string;
		info_link?: string;
		info_link_title?: string;
		children: Snippet;
	};

	let {
		open = $bindable(),
		onClose,
		title,
		subtitle,
		info,
		info_link,
		info_link_title,
		children
	}: Props = $props();

	function handleOpenChange(value: boolean) {
		if (!value) {
			onClose();
		}
		open = value;
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content
		showCloseButton={false}
		class="evidence-page-theme flex max-h-[calc(100vh-3rem)] w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] flex-col gap-0 overflow-hidden p-4 sm:max-w-[calc(100vw-3rem)]"
	>
		<Dialog.Close
			class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Close</span>
		</Dialog.Close>
		<Dialog.Title class="sr-only">{title ?? 'Table'}</Dialog.Title>
		{#if title || subtitle}
			<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
		{:else}
			<!-- Reserve header space so the close button's focus ring doesn't overlap the table -->
			<div class="mb-2 h-5" aria-hidden="true"></div>
		{/if}
		<div class="flex-1 overflow-auto">
			{@render children()}
		</div>
	</Dialog.Content>
</Dialog.Root>
