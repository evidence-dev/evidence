<script lang="ts">
	import { getConditionalContext } from '../conditional-context';
	import { untrack } from 'svelte';
	import { schema } from './schema';
	import type { UserComponentProps } from '../../../types';
	import { getNodeContext } from '../../../Renderer/node-context';
	import { setupContainerReadiness } from '../../../../readiness.svelte';

	const props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children);

	const tag = getNodeContext()?.tag;
	const id = tag?.id;
	const ctx = getConditionalContext();

	// Container readiness: creates a child scope for descendants.
	// Else has no query of its own, but it can't be "self-ready" until the
	// conditional system has decided which branch renders. If the If/ElseIf
	// conditions are still loading (returning undefined), isResolved() returns
	// false, preventing premature completion before children have a chance to mount.
	setupContainerReadiness('else', () => ctx.isResolved());

	let hasRegistered = $state(false);
	if (id) {
		// register condition synchronously for SSR compatibility
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		ctx.addCondition(id, 'else', () => true, children);
		hasRegistered = true;
	}
	$effect(() => {
		if (id) {
			if (!hasRegistered) {
				untrack(() => {
					ctx.addCondition(id, 'else', () => true, children);
				});
				hasRegistered = true;
			}
			return () => {
				ctx.removeCondition(id);
				hasRegistered = false;
			};
		}
	});
</script>

{#if id && ctx.shouldRender(id)}
	{@render children?.()}
{/if}
