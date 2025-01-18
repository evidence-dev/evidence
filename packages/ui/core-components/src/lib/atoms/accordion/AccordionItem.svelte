<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	import Info from '../../unsorted/ui/Info.svelte';
	export let title = '';
	export let compact = false;

	let className = undefined;
	export { className as class };

	export let description = undefined;
</script>

{#key title}
	<BaseAccordion.Item value={title} class={className}>
		<BaseAccordion.Trigger class={compact ? 'py-0' : ''}>
			<span>
				<slot name="title">
					{title}
					{#if description}
						<Info {description} />
					{/if}
				</slot>
			</span>
		</BaseAccordion.Trigger>
		<BaseAccordion.Content>
			<slot />
		</BaseAccordion.Content>
	</BaseAccordion.Item>
{/key}
