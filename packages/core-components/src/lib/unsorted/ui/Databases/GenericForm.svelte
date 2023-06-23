<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import InfoIcon from './InfoIcon.svelte';

	export let opts;
	export let credentials;
	export let disableSave;

	$: requiredOpts = opts.filter((d) => d.optional !== true);
	$: optionalOpts = opts.filter((d) => d.optional === true);
	$: overrideOpts = opts.filter((d) => d.optional === true && d.override === true);

	function handleChange() {
		let filledFields = 0;
		let fieldStatus = false;

		let overrideFields = 0;
		let overrideFieldStatus = false;

		for (let i = 0; i < requiredOpts.length; i++) {
			fieldStatus =
				credentials[requiredOpts[i].id] != undefined && credentials[requiredOpts[i].id] !== '';
			filledFields = filledFields + fieldStatus;
		}

		for (let j = 0; j < overrideOpts.length; j++) {
			overrideFieldStatus =
				credentials[overrideOpts[j].id] != undefined && credentials[overrideOpts[j].id] !== '';
			overrideFields = overrideFields + overrideFieldStatus;
		}

		if (filledFields === requiredOpts.length || overrideFields > 0) {
			disableSave = false;
		} else {
			disableSave = true;
		}
	}
</script>

{#each requiredOpts as opt}
	<div class="input-item">
		<label for={opt.id} class="flex items-center gap-1">
			{opt.label}

			{#if opt.additionalInstructions}
				<InfoIcon>{opt.additionalInstructions}</InfoIcon>
			{/if}
		</label>

		{#if opt.type === 'text'}
			<input
				type="text"
				id={opt.id}
				name={opt.id}
				data-test-id={opt.dataTestId ?? opt.id}
				bind:value={credentials[opt.id]}
				placeholder={opt.placeholder}
				on:keyup={handleChange}
			/>
		{:else if opt.type === 'password'}
			<input
				type="password"
				id={opt.id}
				name={opt.id}
				data-test-id={opt.dataTestId ?? opt.id}
				placeholder="password"
				bind:value={credentials[opt.id]}
				on:keyup={handleChange}
			/>
		{:else if opt.type === 'toggle'}
			<label class="switch">
				<input type="checkbox" bind:checked={credentials[opt.id]} on:change={handleChange} />
				<span class="slider" />
			</label>
		{/if}
	</div>
{/each}

{#if optionalOpts.length > 0}
	<div class="separator">Optional</div>
{/if}

{#each optionalOpts as opt}
	<div class="input-item">
		<label for={opt.id} class="flex items-center gap-1">
			{opt.label}

			{#if opt.additionalInstructions}
				<InfoIcon>{opt.additionalInstructions}</InfoIcon>
			{/if}
		</label>

		{#if opt.type === 'text'}
			<input
				type="text"
				id={opt.id}
				name={opt.id}
				bind:value={credentials[opt.id]}
				placeholder={opt.placeholder}
				on:keyup={handleChange}
			/>
		{:else if opt.type === 'password'}
			<input
				type="password"
				id={opt.id}
				name={opt.id}
				placeholder="password"
				bind:value={credentials[opt.id]}
				on:keyup={handleChange}
			/>
		{:else if opt.type === 'toggle'}
			<label class="switch">
				<input type="checkbox" bind:checked={credentials[opt.id]} on:change={handleChange} />
				<span class="slider" />
			</label>
		{/if}
	</div>
{/each}

<style>
	.switch {
		position: relative;
		display: inline-block;
		width: 2.8rem;
		height: 1.75rem;
		margin-left: auto;
		margin-right: 2px;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 25px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 1.25rem;
		width: 1.25rem;
		left: 4px;
		bottom: 4px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 50%;
		box-shadow: 0px 1px 2px var(--grey-500);
	}

	input:checked + .slider {
		background-color: var(--green-500);
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(1.1rem);
		-ms-transform: translateX(1.1rem);
		transform: translateX(1.1rem);
	}

	div.input-item {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-top: 1.1em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

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
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		color: var(--grey-800);
	}

	.separator {
		display: flex;
		align-items: center;
		text-align: center;
		margin-block-start: 2.5em;
		color: var(--grey-600);
		font-weight: bold;
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
</style>
