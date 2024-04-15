<script>
	import { HoverCard } from '@evidence-dev/core-components';
	export let name = '';
	export let description = '';
	export let required = false;
	export let options = [];
	export let defaultValue = '';
	export let type = '';
	let copyStatus = {};

	async function copyToClipboard(text, option) {
		try {
			await navigator.clipboard.writeText(text);
			copyStatus[option] = true;
			setTimeout(() => {
				copyStatus[option] = false;
			}, 2000);
		} catch (err) {}
	}
</script>

<section class="py-4 border-b text-sm flex flex-col lg:flex-row gap-4">
	<div class="min-w-48 flex justify-between mr-4">
		<div class="font-mono">
			<span
				class="px-1 py-0.5 text-xs font-medium text-gray-950 bg-gray-50 border rounded select-all"
			>
				{name}
			</span>
		</div>
		{#if required}
			<span class="text-red-500">Required</span>
		{/if}
	</div>
	<div>
		<div>{@html description}</div>
		{#if Array.isArray(options) && options.length > 0}
			<div class="flex items-center mt-2 flex-wrap select-none">
				<span class="text-sm text-gray-400">Options: &nbsp;</span>
				<div class="flex gap-1 flex-wrap">
					{#each options as option}
						<HoverCard>
							<button
								slot="trigger"
								class="bg-blue-50  rounded-full min-w-3 px-3 text-blue-700 hover:bg-blue-200 hover:text-blue-800 flex justify-center transition-colors duration-200"
								on:click={() => copyToClipboard(`${name}=${option}`, option)}
							>
								{option}
							</button>
							<div slot="content" class="text-xs text-center min-w-28">
								<p class="font-mono bg-gray-50 rounded-t-md border-b px-4 py-1 text-gray-700">{name}=<span class="text-blue-700">{option == 'true' ? '{true}': option == 'false' ? '{false}' : option}</span></p>
								<p class="px-4 py-1 text-gray-700 font-sans">
									{copyStatus[option] ? 'Copied' : 'Click to Copy'}
								</p>
							</div>
						</HoverCard>
					{/each}
				</div>
			</div>
		{:else if typeof options === 'string' && options.length > 0}
			<dl class="flex items-center mt-2 relative">
				<dt class="text-sm text-gray-400">Options:</dt>
				<dd class="ml-2 text-sm">{options}</dd>
			</dl>
		{/if}
		{#if defaultValue && defaultValue !== '-'}
			<dl class="flex items-center mt-2">
				<dt class="text-sm text-gray-400">Default:</dt>
				<dd class="ml-2 text-sm">{defaultValue}</dd>
			</dl>
		{/if}
		{#if Array.isArray(type) && type.length > 0}
			<div class="flex items-center mt-2">
				<span class="text-sm text-gray-400">Type:</span>
				{#each type as t, index (t)}
					<span class="ml-2 text-sm bg-blue-100 rounded-full px-2 py-0.5">{t}</span>
				{/each}
			</div>
		{:else if typeof type === 'string' && type.length > 0}
			<dl class="flex items-center mt-2">
				<dt class="text-sm text-gray-400">Type:</dt>
				<dd class="ml-2 text-sm bg-blue-100 rounded-full px-2 py-0.5">{type}</dd>
			</dl>
		{/if}
	</div>
</section>
