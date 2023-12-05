<script>
	import NewSourceForm from './NewSourceForm.svelte';
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

	let lastAdded;

	function addNewSource(e) {
		const { newSourceType, newSourceName } = e.detail;
		if (!newSourceType) return;
		const target = availableSourcePlugins[newSourceType];
		sources.push({
			name: newSourceName,
			type: newSourceType,
			package: target.package.package.name,
			options: {}
		});
		lastAdded = newSourceName;
		sources = sources;
		showNewSource = false;
	}

	let duplicatePackageNames = [];
	$: if (sources.length) {
		const allNames = sources.reduce(
			(a, v) => {
				if (a.sourceNames.has(v.name)) {
					a.duplicateNames.add(v.name);
				}
				a.sourceNames.add(v.name);

				return a;
			},
			{ sourceNames: new Set(), duplicateNames: new Set() }
		);

		duplicatePackageNames = Array.from(allNames.duplicateNames);
	}
</script>

<section class="w-full mt-8">
	<div class="p-3 rounded-t w-full border-gray-200 border">
		<h2 class="font-semibold text-lg mb-2">Data Sources</h2>

		<div
			class="grid grid-rows-auto source-config-table gap-x-2 gap-y-2 justify-center items-center w-full"
		>
			{#if sources.length > 0}
				<div class="contents font-bold text-sm">
					<p class="w-4" />
					<p>Name</p>
					<p>Type</p>
					<p />
				</div>

				{#if duplicatePackageNames.length}
					<div class="col-span-4">
						<p class="text-red-500 text-bold text-sm">
							Duplicate Packages found; this could lead to unexpected behavior
						</p>
						<ul>
							{#each duplicatePackageNames as d}
								<li>{d}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#each sources as source (source.name)}
					<SourceConfigRow
						{availableSourcePlugins}
						{source}
						startOpen={lastAdded === source.name}
					/>
				{/each}

				<div class="col-start-4 flex justify-end items-center w-full">
					<button
						class="flex bg-green-600 gap-2 mx-1 border border-green-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition"
						on:click={() => (showNewSource = !showNewSource)}>Add new source</button
					>
				</div>

				{#if showNewSource}
					<NewSourceForm {availablePackages} on:newSource={addNewSource} />
				{/if}
			{:else}
				<!-- There are no sources; we should show a hero to make it more clear to the user -->
				<section class="col-span-4">
					<NewSourceForm ghost {availablePackages} on:newSource={addNewSource} />
				</section>
			{/if}
		</div>

		<div />
	</div>
	<div class="p-4 rounded-b w-full bg-gray-100 text-sm">
		<!-- TODO: Update this when we have docs -->
		Learn more about <a href="https://docs.evidence.dev/">Configuring Data Sources &rarr;</a>
	</div>
</section>

<style lang="postcss">
	.source-config-table {
		grid-template-columns: auto auto auto 1fr;
	}
</style>
