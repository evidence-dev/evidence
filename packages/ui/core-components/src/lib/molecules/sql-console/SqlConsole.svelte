<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	/** @typedef {import('./sqlConsole.action.js').SqlConsoleArgs} SqlConsoleArgs */
	import { sqlConsole, buildAutoCompletes } from './sqlConsole.action.js';
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	import { Button } from '../../atoms/button';
	import DataTable from '../../unsorted/viz/table/DataTable.svelte';

	import { Eye, EyeOff, PlayerPlay } from '@evidence-dev/component-utilities/icons';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { getThemeStores } from '../../themes/themes.js';

	/** @type {boolean} */
	export let hideErrors = false;
	/** @type {string} */
	export let initialQuery = "select 'ABC' as category, 123 as num, 26400000 as sales_usd";
	/** @type {boolean} */
	export let showResults = true;
	/** @type {boolean} */
	export let disabled = false;

	/** @type {string} */
	let currentQuery = initialQuery;

	/** @type {string} */
	let editorQuery = currentQuery;

	/*
	 - Try to fix autocomplete
		 - non-namespaced?
		- keyword updates
	 */

	/** @type {import("@evidence-dev/sdk/usql").Query} */
	export let data = buildQuery(currentQuery);

	$: if (currentQuery) {
		data = buildQuery(currentQuery);
		data.fetch();
	}

	/** @type {HTMLElement | undefined} */
	let editor;
	/** @type {SqlConsoleArgs | undefined} */
	let consoleArgs;

	$: if (consoleArgs) consoleArgs.disabled = disabled;
	onMount(
		/** @returns {Promise<never>} */
		async () => {
			if (data) data.fetch(); // we actually don't really care about this

			consoleArgs = {
				initialState: initialQuery,
				disabled: disabled,
				schema: await buildAutoCompletes(),
				onChange: (v) => {
					if (!v.docChanged) return;
					if (editorQuery.trim() === v.state.doc.toString().trim()) return;
					editorQuery = v.state.doc.toString();
				},
				onSubmit: () => {
					currentQuery = editorQuery.trim();
					if (currentQuery.endsWith(';'))
						currentQuery = currentQuery.substring(0, currentQuery.length - 1);
					showResults = true;
					return true;
				}
			};
		}
	);

	const { theme } = getThemeStores();
</script>

<h1 class="markdown">SQL Console</h1>
<section
	class="px-0 py-2 flex flex-col gap-2 min-h-[8rem]"
	on:click={() => editor?.focus()}
	on:keydown={(e) => e.key === 'Enter' && editor?.focus()}
	role="none"
>
	<div
		bind:this={editor}
		class="w-full relative rounded border border-base-300 min-h-[8rem] cursor-text"
		use:sqlConsole={{
			...consoleArgs,
			theme: $theme
		}}
	>
		{#if !disabled}
			<div class="absolute bottom-2 right-2 z-10 flex gap-2">
				<Button
					size="sm"
					outline
					icon={showResults ? EyeOff : Eye}
					on:click={() => (showResults = !showResults)}
				>
					{#if showResults}
						Hide Results
					{:else}
						Show Results
					{/if}
				</Button>
				<Button
					size="sm"
					variant="success"
					outline
					icon={PlayerPlay}
					on:click={() => {
						currentQuery = editorQuery;
						showResults = true;
					}}
					>Submit
				</Button>
			</div>
		{/if}
	</div>

	{#if $data.error && !hideErrors && Boolean(currentQuery)}
		<pre class="text-negative text-xs font-mono">{$data.error}</pre>
	{/if}

	<!-- Result View -->
	{#if showResults}
		<div transition:slide|local>
			<DataTable data={$data} />
		</div>
	{/if}
</section>

<style lang="postcss">
	section :global(.cm-editor) {
		@apply min-h-[8rem] rounded;
	}
</style>
