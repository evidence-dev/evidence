<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */
	/** @typedef {{ package: { package: import('@evidence-dev/sdk/plugins').DatasourcePackage } }} DatasourcePlugin */

	import NewSourceForm from './NewSourceForm.svelte';
	import SourceConfigRow from './SourceConfigRow.svelte';
	import { Button } from '../../atoms/button/index.js';
	import { Plus, Database, Icon } from '@evidence-dev/component-utilities/icons';
	import { fly } from 'svelte/transition';

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

	/** @param {import('svelte').ComponentEvents<NewSourceForm>['newSource']} e */
	function addNewSource(e) {
		sources.push(e.detail);
		sources = sources;
	}

	let addingSource = false;
</script>

<div>
	{#if sources?.length > 0}
		{#if !addingSource}
			<div
				class="mb-4 rounded-md shadow-sm bg-gradient-to-br from-base-100 to-base-100/60 border"
				in:fly|local={{ y: -100 }}
			>
				{#each sources as source (source?.name)}
					<SourceConfigRow {availableSourcePlugins} {source} {sources} />
				{/each}
			</div>
			<Button
				size="xl"
				icon={Plus}
				iconPosition="left"
				class="w-full"
				on:click={() => (addingSource = true)}
			>
				New Source
			</Button>
		{:else}
			<div in:fly|local={{ y: 100 }} class=" py-4 border rounded-md shadow-sm border-base-300 p-4">
				<NewSourceForm
					{availableSourcePlugins}
					{availablePackages}
					{sources}
					on:newSource={addNewSource}
					bind:addingSource
				/>
			</div>
		{/if}
	{:else if !addingSource}
		<div
			class="bg-base-200 rounded-xl flex flex-col gap-8 items-center p-8"
			in:fly|local={{ y: -100 }}
		>
			<div class="flex flex-col items-center gap-2">
				<Icon src={Database} class="text-base-300 h-14 w-14" />
				<div class="flex flex-col items-center text-sm">
					<p class="font-semibold text-base-content">No Sources</p>
					<p class="text-base-content-muted">Get started by adding your first source.</p>
				</div>
			</div>
			<Button
				variant="primary"
				size="xl"
				class="w-full"
				icon={Plus}
				iconPosition="left"
				on:click={() => (addingSource = true)}
			>
				New Source
			</Button>
		</div>
	{:else}
		<div in:fly|local={{ y: 100 }} class="py-4 border rounded-md shadow-sm border-base-300 p-4">
			<NewSourceForm
				{availableSourcePlugins}
				{availablePackages}
				{sources}
				on:newSource={addNewSource}
				bind:addingSource
			/>
		</div>
	{/if}
</div>
