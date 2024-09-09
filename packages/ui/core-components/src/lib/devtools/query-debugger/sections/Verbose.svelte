<script>
	import ContentBox from '../../../atoms/content-box/ContentBox.svelte';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox togglable defaultOpen={false}>
	<span slot="header">Verbose Info</span>
	<div class="grid grid-cols-3 gap-4 w-full">
		<div class="flex flex-col gap-2 col-span-2">
			<span class="font-bold">Options</span>
			<span>
				<pre class="text-xs font-mono pl-4">{JSON.stringify(
						{ ...query.opts, initialData: undefined },
						null,
						2
					)}</pre>
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
