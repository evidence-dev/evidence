<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	import { toBoolean } from '$lib/utils.js';
	export let single = false;
	import InlineError from '../inputs/InlineError.svelte';
	$: single = toBoolean(single);

	let className = undefined;
	export { className as class };
</script>

{#if !$$slots.default}
	<InlineError
		inputType="Accordion"
		height="52"
		width="100%"
		error={['No </AccordionItem> found']}
	/>
{:else}
	<BaseAccordion.Root class={className} multiple={!single}>
		<slot />
	</BaseAccordion.Root>
{/if}
