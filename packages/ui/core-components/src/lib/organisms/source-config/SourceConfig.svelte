<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */
	/** @typedef {{ package: { package: import('@evidence-dev/sdk/plugins').DatasourcePackage } }} DatasourcePlugin */

	import NewSourceForm from './NewSourceForm.svelte';
	import SourceConfigRow from './SourceConfigRow.svelte';
	import { Button } from '../../atoms/button/index.js';
	import { FolderPlus } from '@evidence-dev/component-utilities/icons';

	/** @type {Record<string, DatasourcePlugin>} */
	export let availableSourcePlugins = {};

	// Pivot to package name instead of db type
	$: availablePackages = Object.values(availableSourcePlugins).reduce((a, v) => {
		const p = v.package.package;
		if (!a[p.name]) a[p.name] = v;
		return a;
	}, /** @type {Record<string, DatasourcePlugin>} */ ({}));

	/** @type {Pick<DatasourceSpec, 'name' | 'type' | 'options' | 'environmentVariables'>[]} */
	export let sources = [];

	let showNewSource = sources.length === 0;

	/** @type {string} */
	let lastAdded;

	/** @param {import('svelte').ComponentEvents<NewSourceForm>['newSource']} e */
	function addNewSource(e) {
		const { newSourceType, newSourceName } = e.detail;
		if (!newSourceType) return;
		sources.push({
			name: newSourceName,
			type: newSourceType,
			options: {},
			environmentVariables: {}
		});
		lastAdded = newSourceName;
		showNewSource = false;
	}

	/** @type {string[]} */
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
	<div class="p-3 rounded-t w-full border-gray-200 border-t border-l border-r">
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

				{#each sources as source}
					<SourceConfigRow
						{availableSourcePlugins}
						{source}
						{sources}
						startOpen={lastAdded === source.name}
					/>
				{/each}

				<div class="col-start-4 flex justify-end items-center w-full">
					<Button
						icon={FolderPlus}
						size="md"
						variant="success"
						on:click={() => (showNewSource = !showNewSource)}
					>
						Add new source
					</Button>
				</div>

				{#if showNewSource}
					<NewSourceForm
						{availablePackages}
						existingSources={sources}
						on:newSource={addNewSource}
					/>
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
	<div class="p-4 rounded-b w-full bg-gray-100 text-sm border-[1px] border-gray-200">
		<!-- TODO: Update this when we have docs -->
		Learn more about
		<a
			class="text-blue-600 no-underline"
			href="https://docs.evidence.dev/core-concepts/data-sources/"
		>
			Configuring Data Sources &rarr;
		</a>
	</div>
</section>

<style lang="postcss">
	.source-config-table {
		grid-template-columns: auto auto auto 1fr;
	}
</style>
