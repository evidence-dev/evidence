<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircle } from '@steeze-ui/tabler-icons';

	export let credentials;
	export let existingCredentials;
	export let gitIgnore;
	existingCredentials.gitignoreDuckdb = gitIgnore
		? gitIgnore.match(/\n.db(?=\n|$)/) && gitIgnore.match(/\n.duckdb(?=\n|$)/)
		: false;
	export let disableSave;

	credentials = { ...existingCredentials };

	credentials = {
		filename: credentials.filename,
		gitignoreDuckdb: credentials.gitignoreDuckdb
	};

	let opts = [
		{
			id: 'filename',
			label: 'Filename',
			type: 'filename',
			additionalInstructions: 'Name of file stored in the same directory as your Evidence project',
			optional: false,
			override: false,
			placeholder: 'mydatabase',
			value: credentials.filename ?? ''
		},
		{
			id: 'gitignoreDuckdb',
			label: 'Gitignore all DuckDB files',
			type: 'toggle',
			additionalInstructions: 'If enabled, Evidence will gitignore .db and .duckdb files',
			optional: false,
			override: false,
			value: credentials.gitignoreDuckdb ?? true
		}
	];

	let filename = opts.filter((d) => d.id === 'filename')[0].value;
	let file;
	let ext;

	if (filename != undefined && filename !== '') {
		file = filename.split('.')[0];
		ext = '.' + filename.split('.')[1];
	}

	let filenameError = false;

	function handleKey() {
		if (file !== '' && file != undefined) {
			filename.value = file + ext;
		}
		credentials.filename = filename.value;
		if (file?.includes('/')) {
			filenameError = true;
			disableSave = true;
		} else if (file === '' || file == undefined) {
			filenameError = false;
			disableSave = true;
		} else {
			filenameError = false;
			disableSave = false;
		}
	}

	function handleCheck() {
		if (file != undefined && file !== '' && filenameError === false) {
			disableSave = false;
		}
	}
</script>

{#each opts as opt}
	<div class="input-item">
		<label for={opt.id} class="flex items-center gap-1">
			{opt.label}

			{#if opt.additionalInstructions}
				<span class="additional-info-icon">
					<Icon src={InfoCircle} class="h-5 text-gray-600 pb-0.5" />
					<span class="info-msg">{opt.additionalInstructions}</span>
				</span>
			{/if}
		</label>

		{#if opt.type === 'filename'}
			<input
				class="basic"
				type="text"
				id="file"
				data-test-id="duckdbFilePrefix"
				name="file"
				placeholder={opt.placeholder}
				required
				class:filenameError
				on:keyup={handleKey}
				bind:value={file}
			/>

			<select
				class="ext"
				class:filenameError
				name="ext"
				id="ext"
				bind:value={ext}
				on:change={handleKey}
			>
				<option value=".db">.db</option>
				<option value=".duckdb">.duckdb</option>
			</select>

			<input
				class="hidden"
				type="text"
				id={opt.id}
				name={opt.id}
				bind:this={filename}
				bind:value={credentials[opt.id]}
			/>
			<p class:filenameError class="error-msg">Filename cannot include folders</p>
		{:else if opt.type === 'toggle'}
			<label class="switch">
				<input type="checkbox" bind:checked={credentials[opt.id]} on:change={handleCheck} />
				<span class="slider" />
			</label>
		{/if}
	</div>
{/each}

<style>
	span.additional-info-icon {
		width: 18px;
		color: var(--grey-600);
		display: inline-block;
		vertical-align: middle;
		line-height: 1em;
		cursor: help;
		position: relative;
		text-transform: none;
	}

	div.input-item {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-top: 1.25em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
	}

	.basic {
		box-sizing: border-box;
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--grey-300);
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-left: 5%;
		width: 50%;
		padding: 0.35em;
		color: var(--grey-999);
		-webkit-appearance: none;
		-moz-appearance: none;
		vertical-align: middle;
		font-size: 16px;
		height: 1.95rem;
	}
	.basic:required {
		box-shadow: none;
	}
	.basic:focus {
		outline: none;
	}

	label {
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		color: var(--grey-800);
		white-space: nowrap;
	}

	.additional-info-icon .info-msg {
		visibility: hidden;
		position: absolute;
		top: -5px;
		left: 105%;
		white-space: nowrap;
		padding-left: 5px;
		padding-right: 5px;
		padding-top: 2px;
		padding-bottom: 1px;
		color: white;
		font-family: sans-serif;
		font-size: 0.8em;
		background-color: var(--grey-900);
		opacity: 0.85;
		border-radius: 6px;
		z-index: 1;
	}

	.additional-info-icon:hover .info-msg {
		visibility: visible;
	}

	.ext {
		appearance: none;
		-webkit-appearance: none;
		outline: none;
		margin-left: -10%;
		box-sizing: border-box;
		background-color: var(--grey-100);
		background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237d8285%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
		background-repeat: no-repeat, repeat;
		background-position: right 0.7em top 50%, 0 0;
		background-size: 0.65em auto, 100%;
		border: 1px solid var(--grey-300);
		color: var(--grey-700);
		border-radius: 0px 4px 4px 0px;
		padding: 0.15em 0.35em;
		font-size: 16px;
		vertical-align: middle;
		height: 1.95rem;
		width: 25%;
		position: relative;
	}

	.filenameError {
		border-color: var(--red-600);
		display: block;
	}

	.error-msg {
		color: var(--red-600);
		font-size: 8pt;
		text-align: right;
		margin-left: 35%;
		padding-top: 0.5em;
		display: none;
	}

	.error-msg.filenameError {
		display: block;
	}

	.hidden {
		display: none;
	}

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
</style>
