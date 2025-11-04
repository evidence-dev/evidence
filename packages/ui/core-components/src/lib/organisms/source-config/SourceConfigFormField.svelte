<script>
	// @ts-check

	import yaml from 'yaml';
	import { slide } from 'svelte/transition';
	import { JSONPath } from '@astronautlabs/jsonpath';

	import SourceConfigFormSection from './SourceConfigFormSection.svelte';
	import Switch from '$lib/atoms/switch/Switch.svelte';

	/** @type {import('@evidence-dev/sdk/plugins').IDatasourceOptionSpec} */
	export let spec;
	export let key;
	/** @type {Record<string, any>} */
	export let options;
	export let disabled;
	export let rootOptions;
	export let reveal;

	$: title = spec.title ?? key;

	const metakey = `_${key}`;

	/** @type {string} */
	let fieldValueKey;
	/** @type {Record<string, unknown>} */
	let childValueTarget;
	// Identify the proper places to find and set values
	if (spec.children) {
		if (spec.nest) {
			fieldValueKey = metakey;
			childValueTarget = options[key] ?? {};
		} else {
			fieldValueKey = key;
			childValueTarget = options;
		}
	} else {
		fieldValueKey = key;
		// This isn't used in this case.
		childValueTarget = {};
	}

	// Actually lookup the value
	let fieldValue = options[fieldValueKey];
	/**
	 * Keep track of the most recent child values
	 * This is needed to make sure we clean them up properly when a new
	 * set of children is needed
	 */
	let mostRecentChildren = {};

	// If there are no children, we should clean this up.
	$: if (spec?.children && !Object.keys(spec.children[fieldValue] ?? {}).length) {
		// Relocate out of the metakey, if needed
		options[key] = fieldValue;
		// Remove the metakey, if needed
		delete options[metakey];
		// We need to track what it previously was, and then remove any of thhose keys from the child value target that we care about.
		if (typeof childValueTarget === 'object')
			for (const k of Object.keys(mostRecentChildren)) delete childValueTarget[k];
		else
			console.warn(`child_value_target was unexpectedly not an object ${childValueTarget}`, {
				key,
				options,
				spec
			});
		mostRecentChildren = spec?.children?.[fieldValue] ?? {};
	} else if (spec?.children?.[fieldValue]) {
		if (spec.nest) {
			// Switch to using the metafield so children can live on the main key
			fieldValueKey = metakey;
			if (typeof options[key] !== 'object') options[key] = {};
			childValueTarget = options[key];
		} else {
			fieldValueKey = key;
			childValueTarget = options;
		}

		options[fieldValueKey] = fieldValue;

		mostRecentChildren = spec?.children?.[fieldValue] ?? {};
	}

	$: refVal = spec.references ? JSONPath.query(rootOptions, spec.references) : null;
	$: if (refVal?.length) fieldValue = refVal[0];

	/** @type {import('svelte/elements').ChangeEventHandler<HTMLInputElement>} */
	async function handleFile(e) {
		if (!e.target) return;

		const { files } = /** @type {{ files: FileList | null }} */ (/** @type {unknown} */ (e.target));
		if (!files) return;

		const [file] = files;

		switch (spec.fileFormat) {
			case 'json':
				try {
					options[fieldValueKey] = await file
						.text()
						.then(/** @param {string} r */ (r) => JSON.parse(r));
				} catch (e) {
					// TODO: Handle this more effectively
					// TODO: Field-level error handling
					error = 'Failed to parse YAML file';
					console.warn(e);
				}
				break;
			case 'yaml':
				try {
					options[fieldValueKey] = await file
						.text()
						.then(/** @param {string} r */ (r) => yaml.parse(r));
				} catch (e) {
					// TODO: Handle this more effectively
					// TODO: Field-level error handling
					error = 'Failed to parse JSON file';
					console.warn(e);
				}
				break;
			default: {
				// Try to detect a json or yaml file
				// TODO: Do we need a field to disable this behavior?
				const text = await file.text();
				try {
					options[fieldValueKey] = JSON.parse(text);
					break;
				} catch {
					/* ignore */
				}

				try {
					options[fieldValueKey] = yaml.parse(text);
					break;
				} catch {
					/* ignore */
				}

				options[fieldValueKey] = await file.text();
				break;
			}
		}
	}

	let error = '';

	// Flush values back up
	$: options[fieldValueKey] = fieldValue;

	$: fieldDisabled = disabled || spec.forceReference || (spec.references && refVal !== null);
</script>

<div class="w-full mb-2">
	<label class="flex flex-col gap-2">
		<span class="text-sm font-medium flex justify-between items-center">
			{title}
			{#if spec.type === 'boolean'}
				<Switch disabled={fieldDisabled} required={spec.required} bind:checked={fieldValue} />
			{/if}
		</span>
		{#if spec.type === 'string'}
			{#if spec.secret && !reveal && spec.shown !== true}
				<input
					disabled={fieldDisabled}
					required={spec.required}
					type="password"
					bind:value={fieldValue}
				/>
			{:else}
				<input
					disabled={fieldDisabled}
					required={spec.required}
					type="text"
					bind:value={fieldValue}
				/>
			{/if}
		{:else if spec.type === 'multiline'}
			<textarea disabled={fieldDisabled} required={spec.required} bind:value={fieldValue} rows="5"
			></textarea>
		{:else if spec.type === 'number'}
			<input
				disabled={fieldDisabled}
				required={spec.required}
				type="number"
				bind:value={fieldValue}
			/>
		{:else if spec.type === 'select' && Array.isArray(spec.options)}
			<select disabled={fieldDisabled} bind:value={fieldValue}>
				<option disabled={spec.required} value={undefined} />
				{#each spec.options as option}
					{#if typeof option === 'string'}
						<option value={option}>{option}</option>
					{:else}
						<option value={option.value}>{option.label}</option>
					{/if}
				{/each}
			</select>
		{:else if spec.type === 'file'}
			<label
				class="flex justify-between items-center px-3 py-2 border border-base-300 rounded-md cursor-pointer hover:bg-base-200 transition-colors"
			>
				<span class="text-base-content">Choose file</span>
				<span class="text-base-content-muted">
					{#if fieldValue}
						{fieldValue.name}
					{:else}
						No file selected
					{/if}
				</span>
				<input class="hidden" disabled={fieldDisabled} type="file" on:change={handleFile} />
			</label>
		{/if}
		<p class="text-negative text-xs">{error}</p>
	</label>
	{#if spec.description}
		<p class="text-xs text-base-content-muted break-words max-w-2xl">{spec.description}</p>
	{/if}
	{#if Object.keys(spec?.children?.[fieldValue] ?? {}).length}
		<div class="pl-4 border-l-2 mt-2 border-base-200" transition:slide|local>
			<SourceConfigFormSection
				{rootOptions}
				{reveal}
				disabled={fieldDisabled}
				bind:options={childValueTarget}
				optionSpec={spec.children?.[fieldValue]}
			/>
		</div>
	{/if}
</div>

<style lang="postcss">
	input:not([type='file']),
	select,
	textarea {
		@apply rounded-md border border-base-300 bg-base-100 shadow-sm px-2 py-1 text-sm focus-visible:ring-base-300 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1;
	}

	input[type='file'] {
		@apply hidden;
	}
</style>
