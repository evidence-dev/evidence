<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import { DeviceFloppy, Plug } from '@evidence-dev/component-utilities/icons';

	import { Button } from '../../atoms/button/index.js';
	import SourceNameField, { validateName } from './atoms/SourceNameField.svelte';
	import SourceConfigFormSection from './SourceConfigFormSection.svelte';

	export let sourcePlugin;

	/** @type {Pick<DatasourceSpec, 'name' | 'type' | 'options'> & { initialName?: string }} */
	export let source;

	/** @type {(Pick<DatasourceSpec, 'name' | 'type' | 'options'> & { initialName?: string })[]} */
	export let sources;

	const dispatch = createEventDispatcher();

	/** @type {boolean} */
	let reveal;

	// Track the name that the source got put in with. This lets us track renaming sources
	source.initialName = source.name;

	let configurationError = '';
	let configurationLoading = false;
	let configurationOkay = false;

	let validationError = '';
	let validationLoading = false;
	let validationOkay = false;

	let nameError = '';

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const callback = ({ action, cancel }) => {
		configurationLoading = false;
		validationLoading = false;
		nameError = validateName(
			source.name,
			sources.filter((s) => s !== source)
		);
		if (nameError) {
			cancel();
			return;
		}

		switch (action.search) {
			case '?/updateSource':
				configurationLoading = true;
				configurationError = '';
				configurationOkay = false;
				break;
			case '?/testSource':
				validationLoading = true;
				validationError = '';
				validationOkay = false;
				break;
		}
		return ({ result, action }) => {
			if (result.type === 'failure') {
				// Some system failure occurred
				if (typeof result.data === 'string') configurationError = result.data;
				else if (typeof result.data === 'object' && 'message' in result.data) {
					switch (action.search) {
						case '?/updateSource':
							configurationError = result.data.message;
							break;
						case '?/testSource':
							validationError = result.data.message;
							break;
					}
				} else configurationError = 'Error saving datasource.';

				configurationLoading = false;
				configurationOkay = false;
				validationLoading = false;
				validationOkay = false;
				return;
			}

			switch (action.search) {
				case '?/updateSource':
					// TODO: Where would configurationError come from?
					if (result.type === 'success') {
						Object.assign(source, result.data?.updatedSource);
					}
					configurationLoading = false;
					configurationOkay = true;
					dispatch('sourceUpdated', source);
					break;
				case '?/testSource':
					if (result.type === 'success') {
						validationError = '';
					}
					validationLoading = false;
					validationOkay = true;
					break;
			}
			// If the user decides to rename it again, we need to be ready
		};
	};
</script>

<form
	use:enhance={callback}
	action="?/updateSource"
	method="POST"
	class="w-full bg-base-200 px-4 py-2 rounded"
>
	<h3 class="text-sm uppercase font-bold">Configure {source.name}</h3>
	<section class="flex flex-col gap-2">
		{#if configurationError}
			<p class="text-negative font-bold text-xs">{configurationError}</p>
		{:else if configurationOkay}
			<p class="text-positive font-bold text-xs">Configuration Updated</p>
		{/if}

		<h4 class="text-xs uppercase font-bold">Source Info</h4>
		<SourceNameField bind:sourceName={source.name} bind:nameError />
		<label class="flex justify-between">
			Source Type
			<input
				disabled
				value={source.type}
				class="rounded border border-base-300 p-1 ml-auto w-2/3 bg-base-100 align-middle text-sm"
			/>
		</label>
		<label class="flex justify-between">
			Reveal Secret Values
			<input
				type="checkbox"
				bind:checked={reveal}
				class="rounded border border-base-300 p-1 ml-auto w-5 bg-base-100 align-middle text-sm"
			/>
		</label>
		{#if Object.keys(sourcePlugin.options).length}
			<hr />
			<h4 class="text-xs uppercase font-bold">Source Options</h4>
			<SourceConfigFormSection
				{reveal}
				disabled={configurationLoading || validationLoading}
				rootOptions={source.options}
				bind:options={source.options}
				optionSpec={sourcePlugin.options}
			/>
		{/if}
	</section>
	<input type="hidden" value={JSON.stringify(source)} name="source" />
	<div class="flex gap-2 justify-end items-center mt-4">
		{#if validationError}
			<p class="text-negative font-bold text-xs">{validationError}</p>
		{:else if validationOkay}
			<p class="text-positive font-bold text-xs">Connection Successful!</p>
		{/if}

		<Button
			outline
			size="md"
			formaction="?/testSource"
			disabled={validationLoading || configurationLoading}
			icon={Plug}
		>
			{validationLoading ? 'Loading...' : 'Test Connection'}
		</Button>

		<Button
			variant="positive"
			icon={DeviceFloppy}
			size="md"
			disabled={configurationLoading || validationLoading}
			type="submit"
		>
			Confirm Changes
		</Button>
	</div>
</form>
