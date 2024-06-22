<script context="module">
	export const evidenceInclude = true;

	const ssrQueries = [];

	Query.addEventListener('queryCreated', (q) => ssrQueries.push(q.proxied));
</script>

<script>
	import { derived, get } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import { Query } from '@evidence-dev/sdk/usql';
	import Hint from '../hint/Hint.svelte';
	import Section from './Section.svelte';
	import { onMount } from 'svelte';

	/** @type {import("svelte/store").Readable< import("@evidence-dev/sdk/usql").QueryValue<any>[] >}*/
	let allQueries = derived([], (v) => v);

	/** @param {{proxied: import("@evidence-dev/sdk/usql").QueryValue}} query */
	const trackQueries = (query) => {
		allQueries = derived([...ssrQueries, ...get(allQueries), query.proxied], (v) => v);
	};

	let selected;
	// @ts-expect-error globalThis isn't defined
	$: window['currentQuery'] = selected;
	onMount(() => {
		Query.addEventListener('queryCreated', trackQueries);
		return () => Query.removeEventListener('queryCreated', trackQueries);
	});
</script>

<section class="mt-8">
	<h2 class="font-bold text-xl">Query Debugger</h2>
	<section>
		{#each $allQueries as q}
			<div
				class:bg-gray-200={selected?.id === q.id && selected?.hash === q.hash}
				class:odd:bg-gray-100={selected?.id !== q.id}
			>
				<button
					on:click={() =>
						selected?.id === q.id && selected?.hash === q.hash
							? (selected = undefined)
							: (selected = q)}
					class="w-full text-left"
				>
					<div class="px-4 py-1">
						{q.id} - {q.hash}
					</div>
				</button>
				{#if selected?.id === q.id && selected?.hash === q.hash}
					<div class="px-8 py-2 flex gap-8 bg-inherit" transition:slide>
						<div class="flex-1 bg-inherit flex flex-col gap-4 h-fit">
							<Section>
								<span slot="header">Execution Times</span>
								<div class="grid grid-cols-4 gap-2 w-fit">
									<span class="font-bold">Data Query Time</span>
									<span>{Math.round(q.dataQueryTime * 10) / 10} ms</span>
									<span class="font-bold">Length Query Time</span>
									<span>{Math.round(q.lengthQueryTime * 10) / 10} ms</span>
									<span class="font-bold">Columns Query Time</span>
									<span>{Math.round(q.columnsQueryTime * 10) / 10} ms</span>
									<span class="font-bold">Score</span>
									<span>
										{q.score.toLocaleString()}
										<Hint>
											Score is a rough estimate of the overall cost of running a Query, take it with
											a grain of salt
										</Hint>
									</span>
								</div>
							</Section>
							<Section>
								<span slot="header">Loading States</span>
								<div class="grid grid-cols-4 gap-2 w-fit">
									<dt class="font-bold">Data Loading</dt>
									<dd>{q.dataLoading}</dd>
									<dt class="font-bold">Data Loaded</dt>
									<dd>{q.dataLoaded}</dd>
									<dt class="font-bold">Length Loading</dt>
									<dd>{q.lengthLoading}</dd>
									<dt class="font-bold">Length Loaded</dt>
									<dd>{q.lengthLoaded}</dd>
									<dt class="font-bold">Columns Loading</dt>
									<dd>{q.columnsLoading}</dd>
									<dt class="font-bold">Columns Loaded</dt>
									<dd>{q.columnsLoaded}</dd>
								</div>
							</Section>
							<Section>
								<span slot="header">Metadata</span>
								<div class="grid grid-cols-2 gap-2 w-fit">
									<dt class="font-bold">Length</dt>
									<dd>{q.length}</dd>

									<dt class="font-bold">Columns</dt>
									<dd>
										{#if q.columnsLoaded}
											<table>
												<tr>
													<th class="px-2">Column Name</th>
													<th class="px-2">Column Type</th>
													<th class="px-2">Nullable</th>
												</tr>
												{#each q.columns as c}
													<tr>
														<td class="px-1">{c.column_name}</td>
														<td class="px-1">{c.column_type}</td>
														<td class="px-1">{c.nullable}</td>
													</tr>
												{/each}
											</table>
										{/if}
									</dd>
									<dt class="font-bold">Ready</dt>
									<dd>{q.ready}</dd>
									<dt class="font-bold">Error</dt>
									<dd>{q.error ? q.error.message : 'None'}</dd>
									<dt class="font-bold">Options</dt>
									<dd><pre class="text-xs">{JSON.stringify(q.opts, null, 2)}</pre></dd>
								</div>
							</Section>
							<Section>
								<span slot="header">Data Preview</span>
								<div class="w-fit">
									{#if q.dataLoaded}
										<pre class="text-xs bg-gray-300 px-2 py-1">{JSON.stringify(
												q.slice(0, 10),
												null,
												2
											)}</pre>
									{:else}
										<button on:click={() => q.fetch()}> Fetch Data </button>
									{/if}
								</div>
							</Section>
						</div>
						<Section>
							<span slot="header">Query Text</span>
							<div class="w-fit">
								<pre class="text-xs bg-gray-300 px-2 py-1">{q.text}</pre>
							</div>
						</Section>
					</div>
				{/if}
			</div>
		{/each}
	</section>
</section>
