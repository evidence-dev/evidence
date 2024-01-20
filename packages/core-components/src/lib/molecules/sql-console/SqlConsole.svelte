<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	/** @typedef {import("@evidence-dev/query-store").QueryStore} QueryStore */
	/** @typedef {import("./sqlConsole.action.js").SqlConsoleArgs} SqlConsoleArgs */
	import { sqlConsole, buildAutoCompletes } from './sqlConsole.action.js';

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { Button } from '../../atoms/button';
	import DataTable from '../../unsorted/viz/table/DataTable.svelte';

	import { Eye, EyeOff, PlayerPlay } from '@evidence-dev/component-utilities/icons';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';

	/** @type {string} */
	export let initialQuery = "SELECT 'Hello World!' as friendly_greeting";
	/** @type {boolean} */
	export let hideErrors = false;

	/** @type {HTMLElement | undefined} */
	let editor;

	// Save w/ this regex? /```(?:query_name|sql query_name)((?:[\n]|.)+)```/g

	/** @type {string} */
	export let currentQuery =
		initialQuery ??
		`
SELECT  category,
        AVG(CAST(r.nps_score AS DECIMAL)) avg_nps
FROM needful_things.orders o
    INNER JOIN needful_things.reviews r ON o.id = r.order_id
GROUP BY o.category
`.trim();
	/** @type {string} */
	let editorQuery = currentQuery;

	/*
	 - Try to fix autocomplete
	 	- non-namespaced?
		- keyword updates
	 */

	/** @type {QueryStore} */
	export let data = buildQuery(currentQuery);

	$: {
		data = buildQuery(currentQuery);
		data.fetch();
	}

	/** @type {SqlConsoleArgs | undefined} */
	let consoleArgs;

	onMount(
		/** @returns {Promise<never>} */
		async () => {
			data.fetch(); // we actually don't really care about this

			consoleArgs = {
				initialState: initialQuery,
				schema: await buildAutoCompletes(),
				onChange: (v) => {
					if (!v.docChanged) return;
					if (editorQuery.trim() === v.state.doc.toString().trim()) return;
					editorQuery = v.state.doc.toString();
				},
				onSubmit: () => {
					currentQuery = editorQuery;
					showResults = true;
					return true;
				}
			};

			return null;
		}
	);

	/** @type {boolean} */
	export let showResults = true;

	/** @type {boolean} */
	export let showControls = true;
</script>

<section
	class="px-4 py-2 bg-white flex flex-col gap-2 min-h-[8rem]"
	on:click={() => editor?.focus()}
	on:keypress={(e) => e.key === 'enter' && editor?.focus()}
	aria-roledescription="Code Editor"
>
	<div
		bind:this={editor}
		class="w-full relative rounded border border-gray-300 min-h-[8rem]"
		use:sqlConsole={consoleArgs}
	>
		{#if showControls}
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
					}}>Submit</Button
				>
			</div>
		{/if}
	</div>

	{#if $data.error && !hideErrors}
		<pre class="text-red-500 text-xs font-mono">{$data.error}</pre>
	{/if}

	<!-- Result View -->
	{#if showResults}
		<div transition:slide>
			<DataTable data={$data} />
		</div>
	{/if}
</section>

<style lang="postcss">
	section :global(.cm-editor) {
		@apply min-h-[8rem] rounded;
	}
</style>
