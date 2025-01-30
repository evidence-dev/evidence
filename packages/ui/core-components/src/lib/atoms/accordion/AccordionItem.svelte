<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import * as BaseAccordion from '../shadcn/accordion';
	import InlineError from '../inputs/InlineError.svelte';
	import Info from '../../unsorted/ui/Info.svelte';
	/** @type {string | undefined} */
	export let title = undefined;
	export let compact = false;
	export let description = undefined;
	import checkRequiredProps from '../inputs/checkRequiredProps.js';

	let className = undefined;
	export { className as class };

	/** @type {[string] | []} */
	const errors = [];

	try {
		if (!$$slots.default) {
			throw new Error(
				'<AccordionItem> requires content to be provided e.g <AccordionItem>Content</AccordionItem>'
			);
		}

		checkRequiredProps({ title });
	} catch (err) {
		errors.push(err);
	}
</script>

{#if errors.length > 0}
	<InlineError inputType="AccordionItem" height="52" width="100%" error={errors} />
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
