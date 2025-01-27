<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let href; // to be deprecated in favor of url
	export let url;
	import InlineError from '../../atoms/inputs/InlineError.svelte';

	if (!href) {
		console.warn('BigLink: href deprecated in favor of url');
	}

	if (!url && !href) {
		console.warn('BigLink: url is required');
	}
</script>

{#if !url && !href}
	<InlineError inputType="BigLink" height="32" width="100%" error="url is required" />
{:else}
	<div class="flex w-full max-w-full flex-col mt-2 mb-4 ml-0 mr-0">
		<a
			href={addBasePath(url ?? href)}
			class="rounded-md shadow-sm overflow-hidden h-8 border
	flex items-center py-1 font-medium px-3 text-xs text-primary truncate
 border-base-300
 hover:bg-base-200 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-300 z-0 bg-base-100"
		>
			<div class="w-full">
				<span>
					<slot />
				</span>
			</div>
		</a>
	</div>
{/if}
