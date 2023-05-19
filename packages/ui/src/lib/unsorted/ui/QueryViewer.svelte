<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { slide, blur } from 'svelte/transition';
	import { dev } from '$app/environment';
	import DataTable from './QueryViewerSupport/QueryDataTable.svelte';
	import ChevronToggle from './ChevronToggle.svelte';
	import Prism from './QueryViewerSupport/Prismjs.svelte';
	import { showQueries } from '@evidence-dev/component-utilities/stores';
	import CompilerToggle from './QueryViewerSupport/CompilerToggle.svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';

	export let queryID;
	export let pageQueries;
	export let queryResult;

	// Title & Query Toggle
	// Create a copy of the showSQL variable in the local storage, for each query. Access this to determine state of each query dropdown.
	let showSQL = writable(
		browser && (localStorage.getItem('showSQL_'.concat(queryID)) === 'true' || false)
	);
	showSQL.subscribe((value) => browser && localStorage.setItem('showSQL_'.concat(queryID), value));

	const toggleSQL = function () {
		$showSQL = !$showSQL;
	};

	// Query text & Compiler Toggle
	let showResults = writable(
		browser && (localStorage.getItem('showResults_'.concat(queryID)) === 'true' || false)
	);
	showResults.subscribe(
		(value) => browser && localStorage.setItem('showResults_'.concat(queryID), value)
	);

	const toggleResults = function () {
		if (!error && nRecords > 0) {
			$showResults = !$showResults;
		}
	};

	let queries;
	let inputQuery;
	let compiledQuery;
	let showCompilerToggle;
	let showCompiled = true;
	let error;
	let nRecords;
	let nProperties;

	$: {
		queries = pageQueries.filter((d) => d.id === queryID);
		inputQuery = queries[0].inputQueryString;
		compiledQuery = queries[0].compiledQueryString;
		showCompilerToggle = queries[0].compiled && queries[0].compileError === undefined;

		// Status Bar & Results Toggle
		error = queryResult[0]?.error_object?.error;
		nRecords = null;
		nProperties = null;
		// Create a copy of the showResults variable in the local storage, for each query. Access this to determine state of each query dropdown.
		if (!error) {
			nRecords = queryResult.length;
			if (nRecords > 0) {
				nProperties = Object.keys(queryResult[0]).length;
			}
		}
	}
</script>

<div class="over-container" in:blur|local>
	{#if $showQueries}
		<!-- Title -->
		<div class="container" transition:slide|local>
			<div class="container-a">
				<button type="button" aria-label="show-sql" on:click={toggleSQL} class="title">
					<ChevronToggle toggled={$showSQL} />
					{queryID}
				</button>
				<!-- Compile Toggle  -->
				{#if $showSQL && showCompilerToggle}
					<CompilerToggle bind:showCompiled />
				{/if}
				<!-- Query Display -->
				{#if $showSQL}
					<div class="code-container" transition:slide|local>
						{#if showCompiled}
							<Prism code={compiledQuery} />
						{:else}
							<Prism code={inputQuery} />
						{/if}
					</div>
				{/if}
			</div>
			<!-- Status -->
			<button
				type="button"
				aria-label="view-query"
				class={'status-bar' +
					(error ? ' error' : ' success') +
					($showResults ? ' open' : ' closed')}
				on:click={toggleResults}
			>
				{#if error}
					{#if dev && error.message === 'Missing database credentials'}
						{error.message}.
						<a class="credentials-link" href="/settings"> Add credentials &rarr;</a>
					{:else}
						{error.message}
					{/if}
				{:else if nRecords > 0}
					<ChevronToggle toggled={$showResults} color="#3488e9" />
					{nRecords.toLocaleString()}
					{nRecords > 1 ? 'records' : 'record'} with {nProperties.toLocaleString()}
					{nProperties > 1 ? 'properties' : 'property'}
				{:else}
					ran successfully but no data was returned
				{/if}
				<!-- Results -->
			</button>
			{#if queryResult.length > 0 && !error && $showResults}
				<DataTable data={queryResult} {queryID} />
			{/if}
		</div>
	{/if}
</div>

<style>
	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	.code-container {
		background-color: var(--grey-100);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		overflow-x: auto;
		overflow-y: hidden;
		padding-top: 0;
		padding-right: 12px;
		padding-bottom: 6px;
		padding-left: 15px;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}
	.code-container::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	.code-container::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}

	.over-container {
		overflow-y: hidden;
		overflow-x: auto;
	}

	.code-container::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	.code-container::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	.code-container::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	.code-container::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	.status-bar {
		margin-top: 0px;
		margin-bottom: 0px;
		background-color: var(--grey-100);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		border-bottom: 1px solid var(--grey-200);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}

	.status-bar::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	.status-bar::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	.status-bar::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	.status-bar::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	.status-bar::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	.status-bar::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	.closed {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
		transition: 400ms;
		transition-delay: 400ms;
		/* 400ms is the default duration for the slide */
	}

	.open {
		border-bottom-left-radius: 0px;
		border-bottom-right-radius: 0px;
		transition: 400ms;
	}

	.status-bar.success {
		color: var(--blue-500);
		cursor: pointer;
	}

	.status-bar.error {
		color: var(--red-600);
	}

	.credentials-link {
		color: var(--blue-500);
		text-decoration: none;
	}

	.credentials-link:hover {
		color: var(--blue-700);
	}

	button {
		font-family: var(--ui-font-family-compact);
		-webkit-font-smoothing: antialiased;
		font-size: 12px;
		-webkit-user-select: none;
		user-select: none;
		white-space: nowrap;
		text-align: left;
		width: 100%;
		background-color: var(--grey-100);
		border: none;
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		margin-bottom: 0px;
		cursor: pointer;
		padding: 5px;
	}

	button.title {
		border-top: 1px solid var(--grey-200);
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	button.results {
		padding: 0.3em 0.6em;
		margin-top: 0px;
		background-color: white;
	}

	.container {
		margin-bottom: 1.2em;
		margin-top: 0.75em;
		display: flex;
		flex-direction: column;
	}

	.container-a {
		background-color: var(--grey-100);
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}
	/* container-a avoids whitespace appearing in the slide transition */

	@media print {
		.container {
			break-inside: avoid;
		}
	}
</style>
