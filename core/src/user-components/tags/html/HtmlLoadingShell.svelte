<script lang="ts">
	/**
	 * Holds a "Loading…" placeholder over sandboxed html content until the
	 * sandbox signals its first render (`evidence.ready()` / auto-complete for
	 * script-free bodies). A timeout fallback reveals the content regardless,
	 * so a block whose script never calls ready() cannot stay hidden forever.
	 *
	 * HtmlModal uses a short fallback (boot flash). Inline Html.svelte uses a
	 * longer one so warehouse-backed `evidence.query` work can finish before
	 * the placeholder disappears.
	 */
	import type { Snippet } from 'svelte';

	type Props = {
		/** Reveal even if onRendered never fires. */
		fallbackMs: number;
		/** When this identity changes, return to the loading state. */
		resetKey?: unknown;
		class?: string;
		children: Snippet<[{ onRendered: () => void }]>;
	};

	let { fallbackMs, resetKey, class: className = '', children }: Props = $props();

	let ready = $state(false);
	$effect(() => {
		void resetKey;
		ready = false;
		const t = setTimeout(() => (ready = true), fallbackMs);
		return () => clearTimeout(t);
	});

	function onRendered(): void {
		ready = true;
	}
</script>

<div class="relative {className}">
	<div class="h-full w-full transition-opacity duration-150" style:opacity={ready ? 1 : 0}>
		{@render children({ onRendered })}
	</div>
	{#if !ready}
		<div
			class="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
		>
			Loading…
		</div>
	{/if}
</div>
