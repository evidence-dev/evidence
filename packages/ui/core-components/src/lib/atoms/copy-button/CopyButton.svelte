<script>
	import { fade } from 'svelte/transition';
	import { Clipboard } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

	export let textToCopy = '';
	let copied = false;
	const copy = () => {
		navigator.clipboard.writeText(textToCopy);
		copied = true;
		setTimeout(() => (copied = false), 1000);
	};
</script>

<div class="relative">
	{#if copied}
		<p
			transition:fade={{ duration: 250 }}
			class="absolute -bottom-14 right-0 text-sm bg-base-200 w-[17ch] text-center font-sans p-2 border border-base-300 rounded"
		>
			Copied to clipboard
		</p>
	{/if}
	<button
		on:click={copy}
		class="bg-base-200 border border-base-300 rounded p-2 hover:bg-base-200/80 active:bg-base-200"
		title="Copy to Clipboard"
	>
		<Icon src={Clipboard} class="w-4 h-4" />
	</button>
</div>
