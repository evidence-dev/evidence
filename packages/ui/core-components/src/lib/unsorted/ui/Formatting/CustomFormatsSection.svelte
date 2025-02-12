<script>
	// @ts-check

	import CustomFormatGrid from './CustomFormatGrid.svelte';
	import { Accordion, AccordionItem } from '../../../atoms/accordion/index.js';
	import Button from '../../../atoms/button/Button.svelte';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	import { slide } from 'svelte/transition';
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
	<div transition:slide|local class="my-4">
		<Accordion>
			<AccordionItem title="Saved Custom Formats">
				<CustomFormatGrid
					formats={customFormattingSettings.customFormats}
					deleteHandler={deleteCustomFormat}
				/>
			</AccordionItem>
		</Accordion>
	</div>
{/if}

<form on:submit|preventDefault={submitNewCustomFormat} autocomplete="off" class="my-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<label for="valueType" class="text-sm font-medium text-base-content">Value Type </label>
			<select
				id="valueType"
				bind:value={valueType}
				class="flex-1 border border-base-300 bg-base-100 shadow-sm text-sm h-9 bg-transparent px-3 py-2 transition-colors focus-visible:outline-none rounded-md cursor-pointer"
			>
				{#each valueTypeOptions as option}
					<option value={option}>
						{option}
					</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-2">
			<label for="formatTag" class="text-sm font-medium text-base-content">Format Name</label>
			<input
				id="formatTag"
				type="text"
				placeholder="myformat"
				bind:value={formatTag}
				class="flex-1 border border-base-300 bg-base-100 shadow-sm text-sm h-9 bg-transparent px-3 py-2 transition-colors focus-visible:outline-none rounded-md"
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="formatCode" class="text-sm font-medium text-base-content">Format Code</label>
			<input
				id="formatCode"
				type="text"
				placeholder={valueType === 'date' ? 'mm/dd/yyyy' : '$#,##0.0'}
				bind:value={formatCode}
				class="flex-1 border border-base-300 bg-base-100 shadow-sm text-sm h-9 bg-transparent px-3 py-2 transition-colors focus-visible:outline-none rounded-md"
			/>
		</div>
		<Button type="submit" size="lg" disabled={!(formatTag && formatCode)}>Add Custom Format</Button>
		<div class="text-negative text-sm">{@html newFormatValidationErrors}</div>
	</div>
</form>
