<script lang="ts" generics="Schema extends UserComponentSchema">
	import type { Tag, ValidateError } from '@markdoc/markdoc';
	import {
		hasComponentWrapper,
		type UserComponent,
		type UserComponentProps,
		type UserComponentSchema
	} from './types';
	import { getRendererContext } from './Renderer/renderer-context';
	import { type Snippet, untrack } from 'svelte';
	import ComponentWrapper from './common/ComponentWrapper.svelte';
	import debounce from 'just-debounce-it';
	import { setupModelContext } from './model-context.svelte';
	import { getUserComponent } from '..';
	import { useStable } from '../useStable.svelte';
	import { doesValidateErrorApplyToTag } from './Renderer/MarkdocProcessor/doesValidateErrorApplyToNode';
	import { logger } from '../shims/logger';
	import { getShowErrorsContext } from '../show-errors.context';

	type Props = {
		tag: Tag<string, UserComponentProps<Schema>>;
		allValidationErrors: ValidateError[];
		children?: Snippet<[]>;
	};
	const { tag, allValidationErrors, children }: Props = $props();

	// This component does not react to tag.name changing, so when rendering <UserComponent/> it should be keyed by tag.name
	const { schema, Component, Model } = getUserComponent(tag.name) as UserComponent<Schema>;

	const stableAttributes = useStable(() => tag.attributes);
	const attributes = $derived(stableAttributes());

	const componentValidationErrors = $derived(
		allValidationErrors.filter((e) => doesValidateErrorApplyToTag(tag, e))
	);
	const shouldRender = $derived(
		!componentValidationErrors.find((error) => error.error.level === 'error')
	);
	// A blocked component still renders its wrapper where errors are shown, so
	// validation failures surface instead of silently dropping the component
	const showErrors = getShowErrorsContext();
	const shouldRenderWrapper = $derived(shouldRender || showErrors);

	const rendererContext = getRendererContext();

	let resetError: (() => void) | undefined = $state();

	const handle = debounce(() => {
		untrack(() => {
			resetError?.();
			resetError = undefined;
		});
	}, 500);

	if (Model) {
		setupModelContext(
			tag.id,
			() => attributes,
			() => componentValidationErrors,
			Model
		);
	}
</script>

<svelte:window onkeydowncapture={resetError ? handle : undefined} />

{#if Component && shouldRenderWrapper}
	{#snippet componentWithOrWithoutChildren()}
		<svelte:boundary
			onerror={(err, reset) => {
				if (rendererContext.context === 'edit') {
					resetError = reset;
				}

				// If we have validation errors, the component error is likely a red herring due to user-error
				if (componentValidationErrors.length) {
					logger.warn(
						{
							err,
							validationErrors: $state.snapshot(componentValidationErrors)
						},
						'svelte:boundary caught error with validation errors'
					);
				} else {
					logger.error(err, 'svelte:boundary caught unexpected error');
				}
			}}
		>
			{#if schema.selfClosing === true}
				<Component {...attributes} />
			{:else}
				<Component {...attributes} {children} />
			{/if}
		</svelte:boundary>
	{/snippet}

	{#if hasComponentWrapper(schema)}
		<ComponentWrapper
			{schema}
			props={attributes}
			validationErrors={componentValidationErrors}
			{tag}
			contentBlocked={!shouldRender}
		>
			{#if shouldRender}
				{@render componentWithOrWithoutChildren()}
			{/if}
		</ComponentWrapper>
	{:else if shouldRender}
		{@render componentWithOrWithoutChildren()}
	{/if}
{/if}
