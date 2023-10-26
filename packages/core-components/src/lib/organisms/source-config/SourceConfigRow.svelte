<script>
	import { slide } from 'svelte/transition';

	import { Icon } from '@steeze-ui/svelte-icon';
	import { Database, Pencil } from '@steeze-ui/tabler-icons';
	import SourceConfigForm from './SourceConfigForm.svelte';

	export let source;
	export let availableSourcePlugins;
	export let startOpen = false

	let open = startOpen;

	$: sourcePlugin = availableSourcePlugins?.[source.type];
</script>

<div class="contents text-xs odd:bg-gray-200">
	{#if sourcePlugin.package.package.evidence.iconUrl}
		<img src={sourcePlugin.package.package.evidence.iconUrl} class="w-4" />
		<!-- TODO: can we actually do this in a safe way? -->
	{:else}
		<Icon src={Database} class="w-4 h-4" />
	{/if}
	<p>{source.name}</p>
	<p>{source.type}</p>
	<p class="font-mono">{sourcePlugin?.package.package.name}</p>
	<div class="flex justify-end">
		<button
			on:click={() => (open = !open)}
			class="flex bg-blue-600 gap-2 mx-1 border border-blue-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-blue-700 hover:border-blue-800 transition"
		>
			<Icon src={Pencil} class="w-3" /> Edit
		</button>
	</div>
</div>

{#if open}
	<div class="col-span-5" transition:slide>
		<SourceConfigForm {source} {sourcePlugin} />
	</div>
{/if}
