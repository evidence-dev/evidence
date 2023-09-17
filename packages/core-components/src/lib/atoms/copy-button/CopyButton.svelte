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
			class="absolute -bottom-14 right-0 text-sm bg-white/80 w-[17ch] text-center font-sans p-2 border border-gray-950 rounded"
		>
			Copied to clipboard
		</p>
	{/if}
	<button
		on:click={copy}
		class="bg-white/80 border border-gray-950 rounded p-2 hover:bg-gray-200/80 active:bg-gray-400/80"
		title="Copy to Clipboard"
	>
		<Icon src={Clipboard} class="w-4 h-4" />
	</button>
</div>
