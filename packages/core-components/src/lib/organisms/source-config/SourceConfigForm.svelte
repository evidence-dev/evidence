<script>
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import SourceConfigFormSection from './SourceConfigFormSection.svelte';
	export let sourcePlugin;
	export let source;

	const dispatch = createEventDispatcher();

	let reveal;

	// Track the name that the source got put in with. This lets us track renaming sources
	source.initialName = source.name;

	let configurationError = '';
	let configurationLoading = false;
	let configurationOkay = false;

	let validationError = '';
	let validationLoading = false;
	let validationOkay = false;

	const callback = ({ action }) => {
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
			if (result.status >= 300) {
				// Some system failure occurred
				if (typeof result.data === 'string') configurationError = result.data;
				else if ('message' in result.data) configurationError = result.data.message;
				else configurationError = 'Error saving datasource.';

				configurationLoading = false;
				configurationOkay = false;
				return;
			}

			switch (action.search) {
				case '?/updateSource':
					// TODO: Where would configurationError come from?
					Object.assign(source, result?.data?.updatedSource);
					source = source;
					configurationLoading = false;
					configurationOkay = true;
					dispatch('sourceUpdated', source);
					break;
				case '?/testSource':
					if (result.data?.success === true) {
						validationError = '';
					} else {
						validationError = result.data?.reason;
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
	class="w-full bg-gray-100 px-4 py-2"
>
	<h3 class="text-sm uppercase gray-600 font-bold">Configure {source.name}</h3>
	<section class="flex flex-col gap-2">
		{#if configurationError}
			<p class="text-red-500 font-bold text-xs">{configurationError}</p>
		{:else if configurationOkay}
			<p class="text-green-500 font-bold text-xs">Configuration Updated</p>
		{/if}
		<label>
			Source Name
			<input bind:value={source.name} />
			<!-- TODO: Regular expression to ensure that this doesn't allow invalid values. -->
		</label>
		<label>
			Reveal Secrets
			<input type="checkbox" bind:checked={reveal} />
		</label>
		<hr />
		<SourceConfigFormSection
			{reveal}
			disabled={configurationLoading || validationLoading}
			rootOptions={source.options}
			bind:options={source.options}
			optionSpec={sourcePlugin.options}
		/>
	</section>
	<input type="hidden" value={JSON.stringify(source)} name="source" />
	<div class="flex gap-2 justify-end items-center">
		{#if validationError}
			<p class="text-red-500 font-bold text-xs">{validationError}</p>
		{:else if validationOkay}
			<p class="text-green-500 font-bold text-xs">Connection Successful!</p>
		{/if}

		<button
			class="flex gap-2 mr-1 text-blue-600 border text-xs px-2 py-1 border-blue-600 font-bold rounded hover:text-blue-700 hover:border-blue-700 transition h-min disabled:bg-gray-100 disabled:text-blue-400 disabled:border-blue-400"
			formaction="?/testSource"
			disabled={validationLoading || configurationLoading}
		>
			{validationLoading ? 'Loading...' : 'Test Connection'}
		</button>

		<button
			class="flex gap-2 mr-1 bg-green-600 border text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition h-min disabled:bg-green-400 disabled:text-gray-100 disabled:border-transparent"
			disabled={configurationLoading || validationLoading}
		>
			Confirm Changes
		</button>
	</div>
</form>
