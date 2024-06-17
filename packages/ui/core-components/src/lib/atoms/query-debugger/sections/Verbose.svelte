<script>
	import { ContentBox } from '../../content-box/index.js';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox togglable defaultOpen={false}>
	<span slot="header">Verbose Info</span>
	<div class="grid grid-cols-6 gap-4 w-full">
		<div class="flex flex-col gap-2 col-span-2">
			<span class="font-bold">Options</span>
			<span>
				<!-- TODO: Make sure we don't render in initialData completely -->
				<pre class="text-sm font-mono pl-4">{JSON.stringify(query.opts, null, 2)}</pre>
			</span>
		</div>

		<!-- Accordion / collapse this -->
		<div class="flex flex-col gap-2 max-w-full col-span-4">
			<span class="font-bold">Trace</span>
			<span class="max-w-full overflow-x-auto">
				<pre class="text-xs font-mono pl-4">{query.createdStack ?? 'Not Available'}</pre>
			</span>
		</div>
	</div>
</ContentBox>
