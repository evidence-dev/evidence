<!-- TODO derive all the props from the props rune to avoid re-running the query other things change -->

<script lang="ts">
	import { getConditionalContext } from '../conditional-context';
	import { untrack } from 'svelte';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';
	import { schema } from './schema';
	import type { UserComponentProps } from '../../../types';
	import { getNodeContext } from '../../../Renderer/node-context';
	import { getModelContext } from '../../../model-context.svelte';
	import { IfModel } from './IfModel.svelte';
	import { setupContainerReadiness } from '../../../../readiness.svelte';

	const props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children);
	const condition = $derived(props.condition);
	const queryInfoContext = getQueryInfoContext();

	//const hasValidationErrors = $derived(hasBlockingErrors());

	const model = getModelContext({ expected: IfModel });
	const query = $derived(model.query);
	const loading = $derived(query.loading);

	// Container readiness: creates a child scope for descendants.
	// This task completes when BOTH:
	// 1. This If's own query has resolved (!loading)
	// 2. All children inside this If block have completed their own readiness
	setupContainerReadiness('if', () => !loading);

	const hasRows = $derived(() => {
		return Number(query.result?.rows?.[0]?.row_count ?? 0) > 0;
	});

	// A failed query is distinct from a genuine zero-row success — surface it, don't render nothing.
	const queryError = $derived(query.error);

	const shouldRender = $derived(() => {
		// Treat an errored branch as undecided (not a non-match) so the chain suppresses
		// `else` immediately — even on the synchronous/SSR pass before setError's effect runs.
		if (queryError) return undefined;
		// If the query is still loading, return undefined
		if (query.result === undefined) return undefined;
		if (condition === 'no_rows') return !hasRows();
		return hasRows();
	});

	const tag = getNodeContext()?.tag;
	const id = tag?.id;
	const componentId = $derived(id ?? '');
	const ctx = getConditionalContext();
	let hasRegistered = $state(false);

	if (id) {
		// register condition synchronously for SSR compatibility
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		ctx.addCondition(id, 'if', () => shouldRender(), children);
		// Register any error synchronously too — the effect below doesn't run on SSR/first paint.
		// svelte-ignore state_referenced_locally
		ctx.setError(id, queryError, {
			retry: () => query.refresh(),
			isRefreshing: () => query.refreshing
		});
		hasRegistered = true;
	}

	$effect(() => {
		if (id) {
			if (!hasRegistered) {
				untrack(() => {
					ctx.addCondition(id, 'if', () => shouldRender(), children);
				});
				hasRegistered = true;
			}
			return () => {
				ctx.removeCondition(id);
				hasRegistered = false;
			};
		}
	});

	$effect(() => {
		if (id)
			ctx.setError(id, queryError, {
				retry: () => query.refresh(),
				isRefreshing: () => query.refreshing
			});
	});

	$effect(() => {
		if (queryInfoContext && componentId) {
			return queryInfoContext.registerQuery(componentId, tag?.name ?? 'if', query);
		}
	});
</script>

{#if id && ctx.shouldRender(id)}
	{@render children?.()}
{/if}
