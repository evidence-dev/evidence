<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	import CustomFormatGrid from './CustomFormatGrid.svelte';
	import CollapsibleTableSection from './CollapsibleTableSection.svelte';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	import ssf from 'ssf';

	/** @type {{ formatTag: string }[]} */
	export let builtInFormats = [];

	/** @type {{ customFormats?: { formatTag: string }[] }}*/
	export let customFormattingSettings = {};

	const valueTypeOptions = ['number', 'date'];

	let formatTag = '';

	let formatCode = '';

	/** @type {'number' | 'date'} */
	let valueType = 'number';

	let newFormatValidationErrors = '';

	/** @param {{ formatTag: string }} format */
	async function deleteCustomFormat(format) {
		const submitted = await fetch(addBasePath('/api/customFormattingSettings.json'), {
			method: 'DELETE',
			body: JSON.stringify({
				formatTag: format.formatTag
			})
		});
		let result = await submitted.json();
		if (result) {
			customFormattingSettings = result;
		}
	}

	async function submitNewCustomFormat() {
		let validationErrors = getValidationErrors();
		if (validationErrors && validationErrors.length > 0) {
			newFormatValidationErrors = validationErrors.join('<br/>');
		} else {
			const submitted = await fetch(addBasePath('/api/customFormattingSettings.json'), {
				method: 'POST',
				body: JSON.stringify({
					newCustomFormat: { formatTag, formatCode, valueType }
				})
			});
			let result = await submitted.json();
			if (result) {
				customFormattingSettings = result;
				resetNewCustomFormat();
			} else {
				newFormatValidationErrors = `Unable to create new custom format ${formatTag}`;
			}
		}
	}

	function resetNewCustomFormat() {
		formatTag = '';
		formatCode = '';
		valueType = 'number';
		newFormatValidationErrors = '';
	}

	function getValidationErrors() {
		let errors = [];
		if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(formatTag)) {
			errors.push(
				`"${formatTag}" is not a valid format name. The format name should always start with a letter and only contain letters and numbers.`
			);
		}
		/** @type {number | Date} */
		let testValue = 10;
		let testResult;
		let ssfError;
		if (valueType === 'date') {
			testValue = new Date();
		}
		try {
			testResult = ssf.format(formatCode, testValue);
		} catch (error) {
			ssfError = error;
		}
		if (!testResult) {
			errors.push(`Format "${formatCode}" is invalid for type "${valueType}".`);
		}
		if (ssfError) {
			errors.push(ssfError);
		}
		if (
			builtInFormats.find((format) => format.formatTag === formatTag) ||
			customFormattingSettings.customFormats?.find((format) => format.formatTag === formatTag)
		) {
			errors.push(`The format name "${formatTag}"" is already assigned to an existing format.`);
		}
		return errors;
	}
</script>

{#if customFormattingSettings.customFormats && customFormattingSettings.customFormats.length > 0}
	<CollapsibleTableSection headerText={'Saved Custom Formats'} expanded={false}>
		<CustomFormatGrid
			formats={customFormattingSettings.customFormats}
			deleteHandler={deleteCustomFormat}
		/>
	</CollapsibleTableSection>
{/if}

<form on:submit|preventDefault={submitNewCustomFormat} autocomplete="off" class="addFormatForm">
	<div class="input-item">
		<label for="valueType">Value Type</label>
		<select id="valueType" bind:value={valueType}>
			{#each valueTypeOptions as option}
				<option value={option}>
					{option}
				</option>
			{/each}
		</select>
	</div>
	<div class="input-item">
		<label for="formatTag">Format Name</label>
		<input id="formatTag" type="text" placeholder="myformat" bind:value={formatTag} />
	</div>
	<div class="input-item">
		<label for="formatCode">Format Code</label>
		<input
			id="formatCode"
			type="text"
			placeholder={valueType === 'date' ? 'mm/dd/yyyy' : '$#,##0.0'}
			bind:value={formatCode}
		/>
	</div>
	<div class="new-format-buttons">
		<button id="submitCustomFormatButton" type="submit" disabled={!(formatTag && formatCode)}
			>Add Custom Format</button
		>
	</div>
	<div class="error">{@html newFormatValidationErrors}</div>
</form>

<style>
	input {
		box-sizing: border-box;
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--base-300);
		background: var(--base-200);
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-left: auto;
		width: 62%;
		padding: 0.35em;
		-webkit-appearance: none;
		-moz-appearance: none;
		vertical-align: middle;
		font-size: 14px;
	}
	input:required {
		box-shadow: none;
	}
	input:focus {
		outline: none;
	}
	label {
		width: 35%;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
	}
	button {
		padding: 0.4em 0.5em;
		margin-right: 0.25em;
		margin-left: 0.25em;
		font-style: normal;
		text-decoration: none;
		font-size: 14px;
		cursor: pointer;
	}
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		border: 1px solid var(--base-300);
		background: var(--base-200);
		border-radius: 4px 4px 4px 4px;
		font-size: 16px;
		font-family: var(--ui-font-family);
		transition: all 400ms;
		cursor: pointer;
		/* copied */
		vertical-align: middle;
		box-sizing: border-box;
		padding: 0.35em;
		margin-left: auto;
		width: 62%;
		font-size: 14px;
	}
	select:hover {
		@apply shadow-md;
		border: 1px solid var(--base-content);
		transition: all 400ms;
	}
	select:focus {
		outline: none;
	}

	div.input-item {
		font-family: var(--ui-font-family);
		font-size: 16px;
		margin-top: 1.1em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}
	div.new-format-buttons {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5em;
	}
	.error {
		color: var(--negative);
	}

	#submitCustomFormatButton {
		background-color: var(--primary);
		color: var(--primary-content);
		font-weight: bold;
		border-radius: 4px;
		padding: 0.4em 1.1em;
		transition-property: background, color;
		transition-duration: 350ms;
	}

	#submitCustomFormatButton:active {
		filter: brightness(1.15);
		font-weight: bold;
		border-radius: 4px;
		padding: 0.4em 1.1em;
		transition-property: background, color;
		transition-duration: 350ms;
	}

	#submitCustomFormatButton:disabled,
	button[disabled] {
		opacity: 0.5;
		cursor: not-allowed;
		transition-property: background, color;
		transition-duration: 350ms;
	}
</style>
