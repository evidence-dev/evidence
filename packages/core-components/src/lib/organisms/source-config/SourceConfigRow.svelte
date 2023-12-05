<script>
	import { slide } from 'svelte/transition';

	import { Icon } from '@steeze-ui/svelte-icon';
	import * as simpleIcons from '@steeze-ui/simple-icons';

	import { Database, ExclamationCircle, Pencil } from '@steeze-ui/tabler-icons';
	import SourceConfigForm from './SourceConfigForm.svelte';
	import { Hint } from '../../atoms/hint';

	export let source;
	export let availableSourcePlugins;
	export let startOpen = false;

	let open = startOpen;

	$: sourcePlugin = availableSourcePlugins?.[source.type];
</script>

<div class="contents text-xs odd:bg-gray-200">
	{#if simpleIcons[sourcePlugin?.package.package.evidence.icon]}
		<Icon src={simpleIcons[sourcePlugin.package.package.evidence.icon]} class="w-6 h-6" />
	{:else if !sourcePlugin}
		<Icon src={ExclamationCircle} class="w-6 h-6 text-red-500" />
	{:else}
		<Icon src={Database} class="w-6 h-6" />
	{/if}
	<p>{source.name}</p>
	<div class="flex gap-2 items-center">
		<p title={sourcePlugin?.package.package.name}>
			{source.type}
		</p>
		{#if !sourcePlugin}
			<p class="text-red-500 font-bold">
				No connector for {source.type} is available
			</p>
			<Hint
				>Make sure you have installed it, and included it in your evidence.plugins.yaml file</Hint
			>
		{/if}
	</div>
	<div class="flex justify-end">
		<!-- This doesn't work, not sure why. Nice to have but not required 
		{#if source.sourceDirectory}
			<button
				class="flex gap-2 mr-1 text-blue-600 border text-xs px-2 py-1 border-blue-600 font-bold rounded hover:text-blue-700 hover:border-blue-700 transition h-min"
			>
				<a href="vscode://{source.sourceDirectory}"> Show in VS Code </a>
			</button>
		{/if}
		-->
		<button
			on:click={() => (open = !open)}
			disabled={!sourcePlugin}
			class="flex bg-blue-600 gap-2 mx-1 border border-blue-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-blue-700 hover:border-blue-800 transition"
		>
			<Icon src={Pencil} class="w-3" /> Edit
		</button>
	</div>
</div>

{#if open}
	<div class="col-span-4" transition:slide>
		<SourceConfigForm {source} {sourcePlugin} on:sourceUpdated={(e) => (source = e.detail)} />
	</div>
{/if}
