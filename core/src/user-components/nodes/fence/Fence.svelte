<script lang="ts">
	import Button from '../../../shadcn/components/ui/button/button.svelte';
	// Common build: full highlight.js ships ~190 grammars (~1.4 MB); unknown langs render plain.
	import hljs from 'highlight.js/lib/common';
	import { Check, Copy } from 'lucide-svelte';
	import './hljs-theme.css';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	const { content, language }: UserComponentProps<typeof schema> = $props();

	const highlighted = $derived.by(() => {
		if (!content || !language) return undefined;
		try {
			return hljs.highlight(content, { language }).value;
		} catch {
			return undefined;
		}
	});

	let copied = $state(false);
	let timeout: ReturnType<typeof setTimeout> | undefined;

	function copyToClipboard() {
		if (!content) return;
		navigator.clipboard.writeText(content.trim());
		copied = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			copied = false;
		}, 1000);
	}
</script>

<div class="group relative">
	<Button
		class="hover:bg-muted border-secondary/50 bg-background text-primary group-hover:border-primary/20 absolute top-2 right-2 h-8 w-8 rounded-md border bg-none opacity-0 shadow-none transition-opacity group-hover:opacity-100 {copied
			? 'text-green-500'
			: ''}"
		onclick={copyToClipboard}
		aria-label="Copy code"
	>
		{#if copied}
			<Check class="mx-auto h-4 w-4" />
		{:else}
			<Copy class="mx-auto h-4 w-4" />
		{/if}
	</Button>
	<pre
		class="hljs bg-muted"
		data-language={language}>{#if highlighted}{@html highlighted}{:else}{content}{/if}</pre>
</div>
