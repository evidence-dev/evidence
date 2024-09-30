<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	export let title = '';
	export let compact = false;

	let className = undefined;
	export { className as class };
</script>

{#key title}
	<BaseAccordion.Item value={title} class={className}>
		<BaseAccordion.Trigger class={compact ? 'py-0' : ''}>
			<slot name="title">
				{title}
			</slot>
		</BaseAccordion.Trigger>
		<BaseAccordion.Content>
			<slot />
		</BaseAccordion.Content>
	</BaseAccordion.Item>
{/key}
