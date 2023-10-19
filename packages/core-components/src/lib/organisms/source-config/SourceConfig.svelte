<script>
	import { slide } from 'svelte/transition';
	import SourceConfigRow from './SourceConfigRow.svelte';

	// TODO: figure out types here
	export let availableSourcePlugins = {};

	// Pivot to package name instead of db type
	$: availablePackages = Object.values(availableSourcePlugins).reduce((a, v) => {
		const p = v.package.package;
		if (!a[p.name]) a[p.name] = v;
		return a;
	}, {});

	export let sources = [];

	let showNewSource = sources.length === 0;
	let newSourceType;
	let newSourceName = 'new-source';
	function addNewSource() {
		if (!newSourceType) return;
		const target = availableSourcePlugins[newSourceType];
		sources.push({
			name: newSourceName,
			type: newSourceType,
			package: target.package.package.name
		});
		sources = sources;
		showNewSource = false;
		newSourceName = 'new-source';
	}

	async function flushChanges() {
		await confirm('Are you sure you want to change your datasource settings?');
		// TODO: Validate the sources
		// TODO: names must be unique

		// TODO: Write logic to save; this needs to be implemented in plugin-connector
	}
</script>

<section class="w-full mt-8">
	<div class="p-3 rounded-t w-full border-gray-200 border">
		<h2 class="font-semibold text-lg mb-2">Data Sources</h2>

		<div
			class="grid grid-rows-auto source-config-table gap-x-2 gap-y-2 justify-center items-center"
		>
			<div class="contents font-bold text-sm">
				<p class="w-4" />
				<p>Name</p>
				<p>Type</p>
				<p>Package</p>
				<p />
			</div>

			{#each sources as source}
				<SourceConfigRow {availableSourcePlugins} {source} />
			{/each}

			<div class="col-start-5 flex justify-end items-center w-full">
				<button
					class="flex bg-blue-600 gap-2 mx-1 border border-blue-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-blue-700 hover:border-blue-800 transition"
					on:click={() => (showNewSource = !showNewSource)}>Add new source</button
				>
				<button
					class="flex bg-green-600 gap-2 mx-1 border border-green-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition"
					on:click={flushChanges}>Confirm Changes</button
				>
			</div>

			{#if showNewSource}
			<!-- TODO: Maybe this should be a modal? -->
				<div class="col-start-5 w-full flex justify-end items-end flex-col my-4" transition:slide>
					
					<div class="grid grid-cols-2 gap-4 items-center">
						<p class="w-full text-center col-span-2 font-bold">New Source:</p>
						
						<label for="new-source-type" class="text-right"> Database Type </label>
						<select
							bind:value={newSourceType}
							name="new-source-type"
							class="px-2 py-1 border border-gray-500 rounded"
						>
							{#each Object.entries(availablePackages) as [name, value]}
								{@const supports = value.package.package.evidence.databases}
								<optgroup label={name}>
									{#each supports as db}
										<option value={db}>{db}</option>
									{/each}
								</optgroup>
							{/each}
						</select>

						<label for="new-source-name" class="text-right"> Source name </label>
						<input
							name="new-source-name"
							class="px-2 py-1 border border-gray-500 rounded"
							bind:value={newSourceName}
						/>

						<button
							class="col-start-2 flex bg-green-600 gap-2 mx-1 border border-green-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition"
							on:click={addNewSource}>Confirm</button
						>
					</div>
				</div>
			{/if}
		</div>

		<div />
	</div>
	<div class="p-4 rounded-b w-full bg-gray-100 text-sm">
		Learn more about <a href="#">Configuring Data Sources &rarr;</a>
	</div>
</section>

<style lang="postcss">
	.source-config-table {
		grid-template-columns: 1em auto auto auto 1fr;
	}
</style>
