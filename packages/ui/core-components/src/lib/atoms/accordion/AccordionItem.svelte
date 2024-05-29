<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	export let title = '';
</script>

<BaseAccordion.Item value={title}>
	<BaseAccordion.Trigger>
		<slot name="title">
			{title}
		</slot>
	</BaseAccordion.Trigger>
	<BaseAccordion.Content>
		<slot />
	</BaseAccordion.Content>
</BaseAccordion.Item>
