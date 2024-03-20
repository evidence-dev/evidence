<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';

	export let single = false;
</script>

<BaseAccordion.Root class="mb-6 w-full" multiple={!single}>
	<slot />
</BaseAccordion.Root>
