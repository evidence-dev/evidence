<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	import { toBoolean } from '$lib/utils.js';
	export let single = false;
	$: single = toBoolean(single);

	let className = undefined;
	export { className as class };
</script>

<BaseAccordion.Root class={className} multiple={!single}>
	<slot />
</BaseAccordion.Root>
