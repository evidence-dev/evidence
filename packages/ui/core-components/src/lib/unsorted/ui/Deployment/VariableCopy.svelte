<script>
	import { blur } from 'svelte/transition';
	import Copy from './CopyIcon.svelte';
	export let text = undefined;
	export let hideText = false;
	let copied = false;

	const toggleCopied = function () {
		copied = false;
	};

	export let copy = async (text) => {
		try {
			if (!copied) {
				await navigator.clipboard.writeText(text);
				copied = true;
				setTimeout(toggleCopied, 2000);
			}
		} catch {
			/* ignore errors */
		}
	};
</script>

<button
	type="button"
	class=" rounded-md bg-base-200 border border-base-300 font-mono text-xs p-2 flex items-center justify-between hover:bg-base-200/50 gap-4"
	class:copied
	on:click={() => {
		if (text !== undefined) {
			copy(text);
		}
	}}
>
	<div class="flex w-3/4 overflow-hidden">
		{#if copied}
			<span in:blur>Copied</span>
		{:else}
			<span in:blur>
				{@html hideText
					? '&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;'
					: text}
			</span>
		{/if}
	</div>
	<div class="w-4 h-4">
		<Copy />
	</div>
</button>
