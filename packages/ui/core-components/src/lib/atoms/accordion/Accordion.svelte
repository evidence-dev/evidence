<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	export let single = false;

	let className = undefined;
	export { className as class };
</script>

<BaseAccordion.Root class={className} multiple={!single}>
	<slot />
</BaseAccordion.Root>
