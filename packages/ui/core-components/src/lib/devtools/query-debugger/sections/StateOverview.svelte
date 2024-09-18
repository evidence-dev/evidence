<script>
	import { ContentBox } from '../../../atoms/content-box/index.js';
	import { Hint } from '../../../atoms/hint/index.js';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox>
	<span slot="header">State Overview</span>
	<!-- 
	This is a silly hack to make the grid space itself out nicely without putting the label/value pairs very far from each other
	 -->
	<div
		class="grid grid-cols-[auto,auto,1fr,auto,auto,1fr,auto,auto] items-center gap-x-2 gap-y-4 w-fit"
	>
		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Data Loading</span>
			<span class="font-mono text-xs">[my-query].dataLoading</span>
		</Hint>
		<span>{query.dataLoading}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Data Loaded</span>
			<span class="font-mono text-xs">[my-query].dataLoaded</span>
		</Hint>
		<span>{query.dataLoaded}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Data Query Time</span>
			<span class="font-mono text-xs">[my-query].dataQueryTime</span>
		</Hint>
		<span>{Math.round(query.dataQueryTime * 10) / 10} ms</span>

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Length Loading</span>
			<span class="font-mono text-xs">[my-query].lengthLoading</span>
		</Hint>
		<span>{query.lengthLoading}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Length Loaded</span>
			<span class="font-mono text-xs">[my-query].lengthLoaded</span>
		</Hint>
		<span>{query.lengthLoaded}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Length Query Time</span>
			<span class="font-mono text-xs">[my-query].lengthQueryTime</span>
		</Hint>
		<span>{Math.round(query.lengthQueryTime * 10) / 10} ms</span>

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle"> Columns Loading</span>
			<span class="font-mono text-xs">[my-query].columnsLoading</span>
		</Hint>
		<span>{query.columnsLoading}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Columns Loaded</span>
			<span class="font-mono text-xs">[my-query].columnsLoaded</span>
		</Hint>
		<span>{query.columnsLoaded}</span>
		<span />

		<Hint maxWidth="md">
			<span class="font-bold" slot="handle">Columns Query Time</span>
			<span class="font-mono text-xs">[my-query].columnsQueryTime</span>
		</Hint>
		<span>{Math.round(query.columnsQueryTime * 10) / 10} ms</span>
	</div>
</ContentBox>
