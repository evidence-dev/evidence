<script>
	// @ts-check
	import { blur } from 'svelte/transition';

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import Switch from '$lib/atoms/switch/Switch.svelte';

	import { Button } from '../../atoms/button/index.js';
	import SourceNameField, { validateName } from './atoms/SourceNameField.svelte';
	import SourceConfigFormSection from './SourceConfigFormSection.svelte';

	export let sourcePlugin;
	export let isNewSource = false;

	/** @type {Pick<DatasourceSpec, 'name' | 'type' | 'options'> & { initialName?: string }} */
	export let source;

	/** @type {(Pick<DatasourceSpec, 'name' | 'type' | 'options'> & { initialName?: string })[]} */
	export let sources;

	const dispatch = createEventDispatcher();

	function handleCancel() {
		dispatch('cancel');
	}

	/** @type {boolean} */
	let reveal;

	// Track the name that the source got put in with. This lets us track renaming sources
	source.initialName = source.name;

	let configurationError = '';
	let configurationLoading = false;
	let configurationOkay = false;
	let lastTestedConfig = '';

	let validationError = '';
	let validationLoading = false;

	let nameError = '';

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const callback = ({ action, cancel }) => {
		configurationLoading = false;
		validationLoading = false;

		// Only validate name if not hidden
		if (!isNewSource) {
			nameError = validateName(
				source.name,
				sources.filter((s) => s !== source)
			);
			if (nameError) {
				cancel();
				return;
			}
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
				break;
		}
		return ({ result, action }) => {
			if (result.type === 'failure') {
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
						configurationOkay = true;
						lastTestedConfig = JSON.stringify(source);
					}
					validationLoading = false;
					break;
			}
		};
	};

	/**
	 * @param {Object} options - The options object to check.
	 * @returns {boolean} - Returns true if there are secret options, otherwise false.
	 */
	function hasSecretOptions(options) {
		if (!options) return false;
		return Object.values(options).some((option) => {
			if (option.secret) return true;
			if (option.children) {
				return Object.values(option.children).some((child) =>
					hasSecretOptions({ [child.title]: child })
				);
			}
			return false;
		});
	}
</script>

<form
	use:enhance={callback}
	action="?/updateSource"
	method="POST"
	class="w-full flex flex-col gap-8 px-1 pt-8 text-sm"
>
	<section class="flex flex-col gap-4">
		{#if !isNewSource}
			<SourceNameField bind:sourceName={source.name} bind:nameError />
		{/if}
		<input
			type="hidden"
			disabled
			value={source.type}
			class="rounded border border-base-300 p-1 ml-auto w-2/3 bg-base-100 align-middle text-sm"
		/>
		{#if Object.keys(sourcePlugin?.options).length}
			<SourceConfigFormSection
				{reveal}
				disabled={configurationLoading || validationLoading}
				rootOptions={source.options}
				bind:options={source.options}
				optionSpec={sourcePlugin?.options}
			/>
		{/if}

		{#if hasSecretOptions(sourcePlugin?.options)}
			<label
				for="reveal-switch-{source?.name}"
				class="flex gap-2 items-center pt-4 border-t border-base-200"
			>
				Show Hidden Values
				<Switch bind:checked={reveal} id="reveal-switch-{source?.name}" />
			</label>
		{/if}
	</section>
	<input
		type="hidden"
		value={JSON.stringify({ ...source, dir: `sources/${source.name}` })}
		name="source"
	/>
	<div class="flex justify-between items-center pt-4">
		<div>
			{#if configurationError}
				<p class="text-negative text-xs max-w-md break-words" in:blur|local>
					{configurationError}
				</p>
			{:else if validationError}
				<p class="text-negative text-xs max-w-md break-words" in:blur|local>{validationError}</p>
			{:else if configurationOkay}
				<div class="flex gap-2 items-center" in:blur|local>
					<div
						class="h-2 w-2 bg-positive rounded-full inline-flex items-center justify-center animate-pulse"
					>
						<div class="h-2 w-2 rounded-full bg-positive"></div>
					</div>
					<p class="text-base-content-muted font-medium text-xs">Connected</p>
				</div>
			{/if}
		</div>
		<div class="flex gap-2 justify-end items-center pt-1">
			{#if isNewSource}
				<Button variant="ghost" type="button" on:click={handleCancel}>Back</Button>
			{/if}

			{#if isNewSource && source?.type === 'duckdb'}
				<!-- 
				The option to create the connection + directory before testing should be added at the plugin level, not in this hardcode. 
				Testing the connection now preceedes saving it and creating a directory. 
				This is awkward for duckdb connections, since you must have the directory created before you can put in the db and have your test pass.
				-->
				<Button
					variant="primary"
					disabled={configurationLoading || validationLoading}
					class={validationLoading ? 'animate-pulse' : 'w-full'}
					type="submit"
				>
					Save
				</Button>
			{:else if !configurationOkay || JSON.stringify(source) !== lastTestedConfig}
				<Button
					variant="primary"
					formaction="?/testSource"
					disabled={validationLoading || configurationLoading}
					class={validationLoading ? 'animate-pulse w-32' : 'w-32'}
				>
					Test Configuration
				</Button>
			{:else}
				<div in:blur|local>
					<Button
						variant="primary"
						disabled={configurationLoading || validationLoading}
						class={validationLoading ? 'animate-pulse' : 'w-32'}
						type="submit"
					>
						Save
					</Button>
				</div>
			{/if}
		</div>
	</div>
</form>
