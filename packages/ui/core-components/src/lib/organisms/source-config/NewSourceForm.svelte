<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Button } from '../../atoms/button/index.js';

	import { DeviceFloppy } from '@evidence-dev/component-utilities/icons';
	import SourceNameField, { validateName } from './atoms/SourceNameField.svelte';

	export let availablePackages;
	export let ghost = false;

	/** @type {Pick<DatasourceSpec, 'name' | 'type'>[]} */
	export let existingSources = [];

	let newSourceType = '';
	let newSourceName = '';

	const dispatch = createEventDispatcher();

	let nameError = '';

	function submit() {
		nameError = validateName(newSourceName, existingSources);
		if (nameError) return;

		dispatch('newSource', { newSourceType, newSourceName });
		newSourceName = '';
	}
</script>

<div
	class="col-span-4 w-full flex justify-end items-end flex-col py-4 px-4 rounded"
	transition:slide
	class:bg-gray-100={!ghost}
>
	<form class="flex flex-col w-full gap-4" on:submit|preventDefault={submit}>
		<h3 class="text-sm uppercase gray-600 font-bold text-left">Add new source</h3>

		<label for="sourceType" class="flex justify-between w-full">
			Datasource Type
			<select
				required
				bind:value={newSourceType}
				name="sourceType"
				class="rounded border border-gray-300 p-1 ml-auto w-2/3 text-gray-950 align-middle text-sm"
			>
				{#each Object.entries(availablePackages) as [name, value]}
					{@const supports = value.package.package.evidence.datasources}
					<optgroup label={name}>
						{#each supports as db}
							{#if Array.isArray(db)}
								{#if db.length}
									<option value={db[0]}>{db[0]}</option>
								{:else}
									<!-- This is a misconfiguratino of the datasource package -->
								{/if}
							{:else}
								<option value={db}>{db}</option>
							{/if}
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>
		<div>
			<SourceNameField bind:sourceName={newSourceName} bind:nameError />
		</div>
		<div class="ml-auto">
			<Button size="md" icon={DeviceFloppy} variant="success" type="submit">Confirm</Button>
		</div>
	</form>
</div>
