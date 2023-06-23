<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InfoCircle } from '@steeze-ui/tabler-icons';

	import Prism from '../QueryViewerSupport/Prismjs.svelte';

	export let credentials;
	export let existingCredentials;
	export let gitIgnore;
	existingCredentials.gitignoreCsv = gitIgnore ? gitIgnore.match(/.csv(?=|$)/) : false;
	export let disableSave;

	credentials = { ...existingCredentials };

	credentials = {
		filename: ':memory:',
		gitignoreCsv: credentials.gitignoreCsv
	};

	let opts = [
		{
			id: 'gitignoreCsv',
			label: 'Gitignore all CSV files',
			type: 'toggle',
			additionalInstructions: 'If enabled, Evidence will gitignore .csv files',
			optional: false,
			override: false,
			value: credentials.gitignoreCsv ?? true
		}
	];

	function handleCheck() {
		disableSave = false;
	}

	let sourcesQuery = `select * from 'sources/myfile.csv'`;
	let absoluteQuery = `select * from '/Users/myname/Documents/myfile.csv'`;
</script>

<p style="margin-top: 15px;">
	Evidence supports querying of local CSV files. CSV querying is powered by DuckDB - <a
		class="docs-link"
		href="https://duckdb.org/docs/sql/query_syntax/select"
		target="_blank"
		rel="noreferrer">see the DuckDB docs for reference on query syntax</a
	>
</p>

<p>
	We recommend setting up a <code>sources</code> directory in the root of your Evidence project to store
	CSV files. You can then query them using this syntax:
</p>
<div class="code-container">
	<Prism language="sql" code={sourcesQuery} />
</div>

<p style="margin-top: 15px;">You can also pass in an absolute filepath:</p>
<div class="code-container">
	<Prism language="sql" code={absoluteQuery} />
</div>

<div class="input-item">
	<label for={opts[0].id} class="flex items-center gap-1">
		{opts[0].label}
		{#if opts[0].additionalInstructions}
			<span class="additional-info-icon">
				<Icon src={InfoCircle} class="h-4 -mr-1 text-gray-600" />
				<span class="info-msg">{opts[0].additionalInstructions}</span>
			</span>
		{/if}
	</label>

	<label class="switch">
		<input type="checkbox" bind:checked={credentials[opts[0].id]} on:change={handleCheck} />
		<span class="slider" />
	</label>
</div>

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

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}

	div.code-container {
		background-color: var(--grey-100);
		border: 1px solid var(--grey-200);
		overflow: auto;
		border-radius: 4px;
	}
</style>
