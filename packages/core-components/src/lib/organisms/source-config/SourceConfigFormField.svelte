<script>
	import yaml from 'yaml';
	import { JSONPath } from '@astronautlabs/jsonpath';

	import SourceConfigFormSection from './SourceConfigFormSection.svelte';

	export let spec;
	export let key;
	export let options;
	export let disabled;
	export let rootOptions;
	export let reveal;

	$: title = spec.title ?? key;

	const metakey = `_${key}`;

	/** @type {string} */
	let field_value_key;
	/** @type {object} */
	let child_value_target;
	// Identify the proper places to find and set values
	if (spec.children) {
		if (spec.nest) {
			field_value_key = metakey;
			child_value_target = options[key] ?? {};
		} else {
			field_value_key = key;
			child_value_target = options;
		}
	} else {
		field_value_key = key;
		// This isn't used in this case.
		child_value_target = {};
	}

	// Actually lookup the value
	let field_value = options[field_value_key];
	let most_recent_children = {};

	// If there are no children, we should clean this up.
	$: if (spec?.children && !Object.keys(spec.children[field_value] ?? {}).length) {
		// Relocate out of the metakey, if needed
		options[key] = field_value;
		// Remove the metakey, if needed
		delete options[metakey];
		// We need to track what it previously was, and then remove any of thhose keys from the child value target that we care about.
		if (typeof child_value_target === 'object')
			for (const k of Object.keys(most_recent_children)) delete child_value_target[k];
		else
			console.warn(`child_value_target was unexpectedly not an object ${child_value_target}`, {
				key,
				options,
				spec
			});
		most_recent_children = spec?.children?.[field_value] ?? {};
	} else if (spec?.children?.[field_value]) {
		if (spec.nest) {
			// Switch to using the metafield so children can live on the main key
			field_value_key = metakey;
			if (typeof options[key] !== 'object') options[key] = {};
			child_value_target = options[key];
		} else {
			field_value_key = key;
			child_value_target = options;
		}

		options[field_value_key] = field_value;

		options = options;
		most_recent_children = spec?.children?.[field_value] ?? {};
	}

	$: refVal = spec.references ? JSONPath.query(rootOptions, spec.references) : null;
	$: if (refVal?.length) field_value = refVal[0];

	async function handleFile(e) {
		const { files } = e.target;
		if (!files) return;

		const [file] = files;

		switch (spec.fileFormat) {
			case 'json':
				try {
					options[field_value_key] = await file.text().then((r) => JSON.parse(r));
				} catch (e) {
					// TODO: Handle this more effectively
					// TODO: Field-level error handling
					console.warn(e);
				}
				break;
			case 'yaml':
				try {
					options[field_value_key] = await file.text().then((r) => yaml.parse(r));
				} catch (e) {
					// TODO: Handle this more effectively
					// TODO: Field-level error handling
					console.warn(e);
				}
				break;
			default:
				options[field_value_key] = await file.text();
				break;
		}
	}

	// Flush values back up
	$: options[field_value_key] = field_value;

	$: fieldDisabled = disabled || spec.forceReference || (spec.reference && refVal !== null);
</script>

<div>
	<label>
		<p class="mr-2 inline-block">
			{title}
			{#if spec.required}<sup class="text-red-500">*</sup>{/if}
		</p>
		{#if spec.type === 'string'}
			{#if spec.secret && !reveal}
				<input
					disabled={fieldDisabled}
					required={spec.required}
					type="password"
					bind:value={field_value}
				/>
			{:else}
				<input
					disabled={fieldDisabled}
					required={spec.required}
					type="text"
					bind:value={field_value}
				/>
			{/if}
		{:else if spec.type === 'boolean'}
			<input
				disabled={fieldDisabled}
				required={spec.required}
				type="checkbox"
				bind:checked={field_value}
			/>
		{:else if spec.type === 'number'}
			<input
				disabled={fieldDisabled}
				required={spec.required}
				type="number"
				bind:value={field_value}
			/>
		{:else if spec.type === 'select'}
			<select disabled={fieldDisabled} bind:value={field_value}>
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
	{#if spec.description}
		<p class="text-sm italic">
			{spec.description}
		</p>
	{/if}

	{#if Object.keys(spec?.children?.[field_value] ?? {}).length}
		<section class="ml-4 flex flex-col gap-2">
			<SourceConfigFormSection
				{rootOptions}
				{reveal}
				disabled={fieldDisabled}
				bind:options={child_value_target}
				optionSpec={spec.children[field_value]}
			/>
		</section>
	{/if}
</div>
