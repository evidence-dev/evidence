<script>
	import { ContentBox } from '../../../atoms/content-box/index.js';
	import { Hint } from '../../../atoms/hint/index.js';
	import LineNumbered from '../utils/LineNumbered.svelte';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox>
	<span slot="header">Metadata</span>

	<div
		class="grid grid-cols-[auto,auto,1fr,auto,auto,1fr,auto,auto] items-center gap-x-2 gap-y-4 w-fit"
	>
		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Identifier</span>
			<span class="font-mono text-xs">[my-query].id</span>
		</Hint>
		<span>{query.id}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Input Text Hash</span>
			<span class="font-mono text-xs">[my-query].hash</span>
		</Hint>
		<span>{query.hash}</span>
		<span />

		<span class="font-bold">
			<Hint maxWidth="md" direction="left">
				<span class="font-bold mr-2" slot="handle">Execution Score</span>
				<span class="font-mono text-xs">[my-query].score</span>
			</Hint>

			<Hint direction="left">
				Score is a rough estimate of the overall cost of running a Query, take it with a grain of
				salt. Lower is better!
			</Hint>
		</span>
		<span>
			{query.score.toLocaleString()}
		</span>

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Length</span>
			<span class="font-mono text-xs">[my-query].length</span>
		</Hint>
		<span>{query.length}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Ready</span>
			<span class="font-mono text-xs">[my-query].ready</span>
		</Hint>
		<span>{query.ready}</span>
		<span />

		<Hint maxWidth="md" direction="left">
			<span class="font-bold" slot="handle">Waiting for Input</span>
			<span class="font-mono text-xs">[my-query].opts.noResolve</span>
		</Hint>
		<span>{query.opts.noResolve}</span>

		<div class="col-span-8 {query.error ? 'flex flex-col gap-2' : 'contents'}">
			<Hint maxWidth="md" direction="right">
				<p class="font-bold" slot="handle">Error</p>
				<p class="font-mono text-xs">[my-query].error?.message</p>
			</Hint>
			{#if query.error}
				<LineNumbered text={query.error.message} />
			{:else}
				<span>No Error</span>
			{/if}
		</div>
	</div>
</ContentBox>
