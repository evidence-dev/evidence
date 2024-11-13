<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let url;
</script>

<a
	href={addBasePath(url)}
	class="font-ui font-normal text-base no-underline border my-5 rounded-lg py-2 px-3 inline-block transition hover:ease-in hover:border-blue-200 hover:bg-blue-100 hover:no-underline hover:text-gray-800 focus:text-gray-900 focus:border-blue-200"
>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>
