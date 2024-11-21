<script>
	// @ts-check

	import yaml from 'yaml';
	import { JSONPath } from '@astronautlabs/jsonpath';

	import SourceConfigFormSection from './SourceConfigFormSection.svelte';
	import Hint from '../../atoms/hint/Hint.svelte';

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

<div class="w-full">
	<label
		class="flex justify-between w-full items-start"
		class:h-11={spec.type !== 'multiline'}
		class:h-auto={spec.type === 'multiline'}
	>
		<div class="mr-2 inline-flex flex-col gap-1">
			<p class="flex items-center gap-1">
				{#if spec.description}
					<Hint>{spec.description}</Hint>
				{/if}
				<span>
					{title}
					{#if spec.required}<sup class="text-red-500">*</sup>{/if}
				</span>
			</p>
			<p class="text-red-500 text-xs font-bold">{error}</p>
		</div>
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
			<textarea
				disabled={fieldDisabled}
				required={spec.required}
				bind:value={fieldValue}
				rows="5"
				class="w-full p-2 mb-3.5"
			></textarea>
		{:else if spec.type === 'boolean'}
			<input
				class="!w-5"
				disabled={fieldDisabled}
				required={spec.required}
				type="checkbox"
				bind:checked={fieldValue}
			/>
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
			<input disabled={fieldDisabled} type="file" on:change={handleFile} />
		{/if}
	</label>
	{#if Object.keys(spec?.children?.[fieldValue] ?? {}).length}
		<section class="ml-4 flex flex-col gap-2 mt-2">
			<SourceConfigFormSection
				{rootOptions}
				{reveal}
				disabled={fieldDisabled}
				bind:options={childValueTarget}
				optionSpec={spec.children?.[fieldValue]}
			/>
		</section>
	{/if}
</div>

<style>
	input,
	select,
	textarea {
		@apply rounded border border-gray-300 p-1 ml-auto w-2/3 text-gray-950 align-middle text-sm;
	}
</style>
