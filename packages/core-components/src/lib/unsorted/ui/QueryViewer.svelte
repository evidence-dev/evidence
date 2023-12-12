<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { slide, blur } from 'svelte/transition';
	import DataTable from './QueryViewerSupport/QueryDataTable.svelte';
	import ChevronToggle from './ChevronToggle.svelte';
	import Prism from './QueryViewerSupport/Prismjs.svelte';
	import { showQueries, localStorageStore } from '@evidence-dev/component-utilities/stores';
	import CompilerToggle from './QueryViewerSupport/CompilerToggle.svelte';
	import { page } from '$app/stores';

	export let queryID;
	/** @type {import("@evidence-dev/query-store").QueryStore} */
	export let queryResult;

	$: pageQueries = $page.data.evidencemeta.queries;

	// Title & Query Toggle
	let showSQL = localStorageStore('showSQL_'.concat(queryID), true);
	// Query text & Compiler Toggle
	let showResults = localStorageStore(`showResults_${queryID}`);

	const toggleSQL = function () {
		$showSQL = !$showSQL;
	};

	const toggleResults = function () {
		if (!error && $queryResult.length > 0) {
			$showResults = !$showResults;
		}
	};

	let inputQuery;
	let showCompilerToggle;
	let showCompiled = true;
	/** @type {undefined | Error } */
	let error = undefined;

	// Enter an error state if the queryResult isn't defined
	$: {
		if (!$queryResult) error = new Error('queryResult is undefined');
		else if ($queryResult.error) error = $queryResult.error;
	}

	$: rowCount = $queryResult?.length ?? 0;
	$: colCount = $queryResult?._evidenceColumnTypes.length ?? 0;

	$: {
		let query = pageQueries?.find((d) => d.id === queryID);

		if (query) {
			inputQuery = query.inputQueryString;
			showCompilerToggle = query.compiled && query.compileError === undefined;
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
							<Prism code={queryResult.originalText} />
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
				class={'status-bar'}
				class:error
				class:success={!error}
				class:open={$showResults}
				class:closed={!$showResults}
				on:click={toggleResults}
			>
				{#if error}
					{error.message}
				{:else if rowCount}
					<ChevronToggle toggled={$showResults} color="#3488e9" />
					{rowCount.toLocaleString()}
					{rowCount > 1 ? 'records' : 'record'} with {colCount.toLocaleString()}
					{colCount > 1 ? 'properties' : 'property'}
				{:else if $queryResult.loading}
					loading...
				{:else}
					ran successfully but no data was returned
				{/if}
				<!-- Results -->
			</button>
			{#if rowCount > 0 && !error && $showResults}
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
		background-color: var(--grey-50);
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
		background-color: var(--grey-50);
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

	button {
		font-family: var(--ui-font-family-compact);
		-webkit-font-smoothing: antialiased;
		font-size: 12px;
		-webkit-user-select: none;
		user-select: none;
		white-space: nowrap;
		text-align: left;
		width: 100%;
		background-color: var(--grey-50);
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

	.container {
		@apply my-3;
		display: flex;
		flex-direction: column;
	}

	.container-a {
		background-color: var(--grey-50);
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
