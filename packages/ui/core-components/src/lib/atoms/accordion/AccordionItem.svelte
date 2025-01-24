<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	import InputError from '../inputs/InputError.svelte';
	import Info from '../../unsorted/ui/Info.svelte';
	export let title = '';
	export let compact = false;
	export let description = undefined;

	let className = undefined;
	export { className as class };

	const errors = [];

	if (!title) {
		errors.push('title is required');
	}

	if (!$$slots.default) {
		errors.push('No accordion content found');
	}
</script>

{#if errors.length > 0}
	<InputError inputType="AccordionItem" height="52" width="100%" error={errors} />
{:else}
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
{/if}
