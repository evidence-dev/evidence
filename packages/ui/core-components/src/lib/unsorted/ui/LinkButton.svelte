<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let url;
</script>

<a
	href={addBasePath(url)}
	class="font-ui font-normal text-base no-underline border border-info/20 bg-info/10 my-5 rounded-lg py-2 px-3 inline-block transition hover:ease-in hover:border-info/50 hover:bg-info/20 hover:no-underline focus:border-info"
>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>
