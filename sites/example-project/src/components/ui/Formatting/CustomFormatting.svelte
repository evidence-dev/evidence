<script>
    import FormatGrid from "./FormatGrid.svelte";
    import * as ssf from 'ssf';

	export let builtInFormats = {};
	export let customSettings = {};

	const valueTypeOptions = ["number", "date"];

	let formatName;
	let formatValue;
	let valueType;
	let editingCustomFormat = false;
	let newFormatValidationErrors = "";

    async function submitNewCustomFormat() {
		let validationErrors = getValidationErrors();
		if (validationErrors && validationErrors.length > 0) {
			newFormatValidationErrors = validationErrors.join("<br/>");
		} else {
			const submitted = await fetch("/api/customSettings.json", {
				method: "POST",
				body: JSON.stringify({
					newCustomFormat : {formatName, formatValue, valueType}
				})
				});
			let result = await submitted.json();
			if (result) {
				customSettings = result;
				resetNewCustomFormat();
			} else {
				newFormatValidationErrors = `Unable to create new custom format ${formatName}`;
			}
		}
    }

    function resetNewCustomFormat() {
		formatName = undefined;
		formatValue = undefined;
		valueType = undefined;
		editingCustomFormat = false;
	}
  
	function showAddCustomFormat() {
		resetNewCustomFormat();
		editingCustomFormat = true;
	}

	function getValidationErrors() {
		let errors = [];
		if (!(/^[a-zA-Z]+$/.test(formatName))) {
			errors.push(`The format name should only contain letters. "${formatName}" has other characters.`);
		}
		let testValue = 10;
		let testResult;
		let ssfError;
		if (valueType === 'date') {
			testValue = new Date();
		}
		try {
			testResult = ssf.format(formatValue, testValue);
		} catch (error) {
			ssfError = error;
		}
		if (!testResult) {
			errors.push(`Format "${formatValue}" is invalid for type "${valueType}".`);
		}
		if (ssfError) {
			errors.push(ssfError);
		}
		if (builtInFormats.find(format => format.formatName === formatName) ||
		    customSettings.customFormats?.find(format => format.formatName === formatName)){
			errors.push(`The format name "${formatName}"" is already assigned to an existing format.`);
		}
		return errors;
	}
</script>
<style>
	input {
        box-sizing: border-box;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-300);
        padding: 0.25em 0.25em 0.25em 0.25em;
        margin-left: auto;
        width: 62%;
        padding: 0.35em;
        color: var(--grey-999);
        -webkit-appearance: none;
        -moz-appearance: none;
        vertical-align:middle;
        font-size: 16px;
    }
    input:required {
       box-shadow: none;
    }
    input:focus{
        outline: none;
    }
    label {
        width: 35%;
        text-transform: uppercase;
        font-weight: normal;
        font-size: 14px;
        color: var(--grey-800)
    }
	button {
		padding:0.4em 0.5em;
		margin-right: 0.25em;
		margin-left: 0.25em;
		font-style: normal;
		text-decoration: none;
		font-size:14px;
		cursor:pointer;
	}
	select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: 1px solid var(--grey-200);
		border-radius: 4px 4px 4px 4px;
		font-size: 16px;
        font-family: var(--ui-font-family);
        color: var(--grey-800);
        transition: all 400ms;
        cursor: pointer;
		/* copied */
        vertical-align:middle;
		box-sizing: border-box;
		padding: 0.35em;
        margin-left: auto;
        width: 62%;
    }
   select:hover{
            border: 1px solid var(--grey-300);
            transition: all 400ms;
            box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
    }
    select:focus {
		outline: none;
    }

	div.input-item{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-top: 1.1em;
        display:flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }
	div.new-format-buttons {
		display:flex;
		justify-content: flex-end;
		padding-top: 0.5em;
	}

	.separator {
        display: flex;
        align-items: center;
        text-align: center;
        margin-block-start: 2.5em;
        color: var(--grey-600);
        font-weight:bold;
    }
	.separator::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--grey-200);
    }

    .separator:not(:empty)::after {
        margin-left: 1.5em;
        margin-top: 0.1em;
    }
	.error {
		color:crimson
	}

</style>

<h2>Custom Formats</h2>

{#if (customSettings.customFormats) }
	<FormatGrid formats={customSettings.customFormats}/>
{/if}

{#if editingCustomFormat }
	<div class="separator">Add a new custom format</div>

	<form on:submit|preventDefault={submitNewCustomFormat} autocomplete="off">
		<div class="input-item">
			<label for="formatName">Format Name</label>
			<input id="formatName" type="text" placeholder="myformat" bind:value={formatName} />
		</div>
		<div class="input-item">
			<label for="formatValue">Format</label>
			<input id="formatValue" type="text" placeholder="$#,##0.0" bind:value={formatValue} />
		</div>
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
        <div class="new-format-buttons">
            <button id="submitCustomFormatButton" type=submit  disabled={ !(formatName && formatValue) }>Add</button>
            <button id="resetNewCustomFormatButton" on:click={resetNewCustomFormat}>Cancel</button>
		</div>
		<div class="error">{@html newFormatValidationErrors}</div>
	</form>
{:else}
   <button id="showAddCustomFormatButton" on:click={showAddCustomFormat} disabled={ editingCustomFormat }>New Custom Format</button>
{/if}