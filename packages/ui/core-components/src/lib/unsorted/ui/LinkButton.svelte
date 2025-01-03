<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let url;
</script>

<div class="inline-flex w-fit max-w-full flex-col mt-2 mb-4 ml-0 mr-2">
	<a
		href={addBasePath(url)}
		class="rounded-md shadow-sm overflow-auto h-8 border
	flex items-center py-1 font-medium px-3 text-xs truncate
 border-base-300
hover:bg-base-200 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-300 z-0 bg-base-100"
	>
		<div>
			<span>
				<slot />
			</span>
		</div>
	</a>
</div>
