<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import BigqueryForm from './BigqueryForm.svelte';
	import PostgresForm from './PostgresForm.svelte';
	import SnowflakeForm from './SnowflakeForm.svelte';
	import RedshiftForm from './RedshiftForm.svelte';
	import MysqlForm from './MysqlForm.svelte';
	import SqliteForm from './SqliteForm.svelte';
	import DuckdbForm from './DuckdbForm.svelte';
	import CSVForm from './CSVForm.svelte';
	import MSSQLForm from './MSSQLForm.svelte';

	import { slide, blur } from 'svelte/transition';

	export let settings;
	export let gitIgnore;

	let credentials = {}; // reflects current state of the form
	let existingCredentials = settings.credentials; // what's saved?
	let testResult = null; // have they run a test
	$: credentialsEdited = JSON.stringify(credentials) != JSON.stringify(existingCredentials); //have they made changes from their saved settings

	// Available connector types and fallback
	const databaseOptions = [
		{ name: 'Choose a data source' },
		{
			id: 'bigquery',
			name: 'BigQuery',
			formComponent: BigqueryForm,
			docsHref: 'https://docs.evidence.dev/core-concepts/data-sources/#bigquery'
		},
		{ id: 'postgres', name: 'PostgreSQL', formComponent: PostgresForm },
		{ id: 'mysql', name: 'MySQL', formComponent: MysqlForm },
		{ id: 'redshift', name: 'Redshift', formComponent: RedshiftForm }, // Redshift uses the postgres connector under the hood
		{ id: 'snowflake', name: 'Snowflake', formComponent: SnowflakeForm },
		{ id: 'sqlite', name: 'SQLite', formComponent: SqliteForm },
		{ id: 'duckdb', name: 'DuckDB', formComponent: DuckdbForm },
		{ id: 'csv', name: 'CSV', formComponent: CSVForm },
		{ id: 'mssql', name: 'SQL Server', formComponent: MSSQLForm }
	];

	let selectedDatabase =
		databaseOptions.filter((d) => d.id === settings.database)[0] ?? databaseOptions[0];
	let disableSave = false;

	async function runTest() {
		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
		await sleep(1000);
		const res = await fetch('/api/testConnection.json', {
			method: 'POST'
		});
		let result = await res.json();
		if (res.ok) {
			return result;
		} else {
			throw new Error(result);
		}
	}

	async function save() {
		settings.database = selectedDatabase.id;
		settings.credentials = credentials;
		const submitted = await fetch('/api/settings.json', {
			method: 'POST',
			body: JSON.stringify({
				settings
			})
		});
		// reset the state of settings
		settings = await submitted.json();
		existingCredentials = settings.credentials;
	}

	async function submitForm() {
		if (credentialsEdited || selectedDatabase.id === 'csv') {
			await save();
			testResult = runTest();
		} else {
			testResult = runTest();
		}
	}

	function databaseChange() {
		testResult = null;
		if (selectedDatabase.id === 'csv') {
			disableSave = false;
		} else {
			disableSave = true;
		}
	}
</script>

<form on:submit|preventDefault={submitForm} autocomplete="off" in:blur|local id="connect-database">
	<div class="container">
		<div class="panel">
			<h2>Data Source Connection</h2>
			<p>Evidence supports one data source per project.</p>
			<p>
				These credentials will be used when running locally. For your production environment, see
				the deployment panel.
			</p>
			<h3>Connection Type</h3>
			<select
				data-test-id="dbConnectionType"
				bind:value={selectedDatabase}
				on:change={databaseChange}
			>
				{#each databaseOptions as option}
					<option data-test-id={option.id} id={option.id} value={option} label={option.name}>
						{option.name}
					</option>
				{/each}
			</select>
		</div>
		{#if selectedDatabase.formComponent}
			<div class="panel" transition:slide|local>
				<svelte:component
					this={selectedDatabase.formComponent}
					bind:disableSave
					bind:credentials
					{gitIgnore}
					existingCredentials={selectedDatabase.id === settings.database ? existingCredentials : {}}
				/>
			</div>
		{/if}
		{#if testResult}
			<div class="panel test-result" transition:slide|local>
				{#await testResult}
					<span class="indicator running" /><span>Testing connection</span>
				{:then result}
					<span class="indicator success" /><span>{result}</span>
				{:catch error}
					<span class="indicator fail" />
					<span style="color:var(--red-600)">Unable to connect</span>
					<p in:slide|local class="error">{error.message}</p>
				{/await}
			</div>
		{/if}
	</div>
	<footer>
		{#if selectedDatabase.docsHref}
			<span
				>Learn more about <a class="docs-link" href={selectedDatabase.docsHref}
					>{selectedDatabase.name} Connection Settings &rarr;</a
				></span
			>
		{:else}
			<span
				>Need help with this step? <a class="docs-link" href="https://docs.evidence.dev/community"
					>Get in touch &rarr;</a
				></span
			>
		{/if}
		{#if selectedDatabase.id}
			{#if credentialsEdited}
				<button type="submit" id="save" disabled={disableSave}>Save</button>
			{:else}
				<button type="submit" id="save">Test</button>
			{/if}
		{:else}
			<button type="submit" id="save" disabled>Save</button>
		{/if}
	</footer>
</form>

<style>
	@keyframes pulse-blue {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 var(--blue-200);
		}

		70% {
			transform: scale(1);
			box-shadow: 0 0 0 6px rgba(255, 82, 82, 0);
		}

		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
		}
	}

	@keyframes pulse-green {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 var(--green-200);
		}

		70% {
			transform: scale(1);
			box-shadow: 0 0 0 6px rgba(255, 82, 82, 0);
		}

		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
		}
	}

	span.indicator {
		border-radius: 100%;
		height: 10px;
		width: 10px;
		margin-right: 8px;
		display: inline-block;
		box-sizing: border-box;
	}

	span.indicator.running {
		background-color: var(--blue-500);
		transform: scale(1);
		animation: pulse-blue 2s infinite;
	}

	span.indicator.success {
		background-color: var(--green-600);
		transform: scale(1);
		animation: pulse-green 2s infinite;
	}

	span.indicator.fail {
		background-color: var(--red-600);
	}

	p.error {
		font-family: 'monoco', Roboto Mono, monospace;
		padding-top: 1em;
		word-break: break-all;
	}

	h3 {
		text-transform: uppercase;
		font-weight: normal;
		font-style: normal;
		font-size: 14px;
	}

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}

	.container {
		border-top: 1px solid var(--grey-200);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}

	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}

	.panel {
		border-top: 1px solid var(--grey-200);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	.panel.test-result {
		padding-top: 1em;
	}

	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		padding: 0.3rem 0.6rem;
		width: 100%;
		border: 1px solid var(--grey-200);
		font-family: var(--ui-font-family);
		color: var(--grey-800);
		margin: 0.5em 0 0 0;
		transition: all 400ms;
		cursor: pointer;
	}

	select:hover {
		border: 1px solid var(--grey-300);
		transition: all 400ms;
		box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
	}

	select:focus {
		outline: none;
	}

	footer {
		border: 1px solid var(--grey-200);
		border-radius: 0 0 5px 5px;
		background-color: var(--grey-100);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}

	button {
		padding: 0.4em 0.5em;
		margin-right: 0.25em;
		margin-left: auto;
		font-style: normal;
		text-decoration: none;
		font-size: 14px;
		cursor: pointer;
	}

	#save {
		background-color: var(--blue-600);
		color: white;
		font-weight: bold;
		border-radius: 4px;
		border: 1px solid var(--blue-700);
		padding: 0.4em 1.1em;
		transition-property: background, color;
		transition-duration: 350ms;
	}

	#save:active {
		background-color: var(--blue-800);
		color: white;
		font-weight: bold;
		border-radius: 4px;
		border: 1px solid var(--blue-900);
		padding: 0.4em 1.1em;
		transition-property: background, color;
		transition-duration: 350ms;
	}

	#save:disabled,
	button[disabled] {
		border: 1px solid var(--grey-400);
		background-color: var(--grey-100);
		color: var(--grey-600);
		cursor: not-allowed;
		transition-property: background, color;
		transition-duration: 350ms;
	}
</style>
