<script lang="ts">
	import { setConditionalContext } from './conditional-context';
	import type { Snippet } from 'svelte';
	import { schema } from './schema';
	import type { UserComponentProps } from '../../types';
	import { getShowErrorsContext } from '../../../show-errors.context';
	import { RefreshCw } from 'lucide-svelte';

	// Raw query errors are only meaningful in the editor; viewers see friendly copy.
	const showErrors = getShowErrorsContext();

	const props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children);

	let conditions = $state<
		Array<{ id: string; tag: string; condition?: () => boolean | undefined; snippet?: Snippet }>
	>([]);
	type BranchError = { message: string; retry?: () => void; isRefreshing?: () => boolean };
	let errors = $state<Record<string, BranchError>>({});

	function setError(id: string, error: string | null, opts?: Omit<BranchError, 'message'>) {
		if (error) {
			if (errors[id]?.message === error) return;
			errors[id] = { message: error, ...opts };
		} else if (id in errors) {
			delete errors[id];
		}
	}

	// First decisive branch in source order wins; errors after a match don't render anyway.
	function resolve(): {
		kind: 'pending' | 'error' | 'match' | 'none';
		id?: string;
		error?: BranchError;
	} {
		for (const cond of conditions) {
			const error = errors[cond.id];
			if (error) return { kind: 'error', error };
			const result = cond.condition?.();
			if (result === undefined) return { kind: 'pending' };
			if (result === true) return { kind: 'match', id: cond.id };
		}
		return { kind: 'none' };
	}

	function addCondition(
		id: string,
		tag: string,
		condition: () => boolean | undefined,
		snippet?: Snippet
	) {
		const idx = conditions.findIndex((cond) => cond.id === id);
		if (idx !== -1) {
			conditions[idx] = { id, tag, condition, snippet };
		} else {
			conditions.push({ id, tag, condition, snippet });
		}

		// Sort by numeric part of node id
		conditions.sort((a, b) => {
			const aNum = Number(a.id.split('-')[1]);
			const bNum = Number(b.id.split('-')[1]);
			return aNum - bNum;
		});
		return id;
	}

	function removeCondition(id: string) {
		conditions = conditions.filter((cond) => cond.id !== id);
		if (id in errors) delete errors[id];
	}

	function shouldRender(id: string): boolean {
		const r = resolve();
		return r.kind === 'match' && r.id === id;
	}

	// True once a decision is made (match, error, or none) — Else waits on this.
	function isResolved(): boolean {
		return resolve().kind !== 'pending';
	}

	function getError(): BranchError | null {
		const r = resolve();
		return r.kind === 'error' ? (r.error ?? null) : null;
	}

	setConditionalContext({
		addCondition,
		removeCondition,
		shouldRender,
		isResolved,
		setError,
		getError
	});

	const error = $derived(getError());

	// Spin the refresh icon while the retry's refetch is in flight, clearing once it settles.
	let retrying = $state(false);
	let wasRefreshing = false;
	$effect(() => {
		const refreshing = error?.isRefreshing?.() ?? false;
		if (wasRefreshing && !refreshing) retrying = false;
		wasRefreshing = refreshing;
	});

	// Re-run just the failed branch's query; fall back to a full reload if no retry was provided.
	function retry() {
		if (error?.retry) {
			retrying = true;
			error.retry();
		} else {
			location.reload();
		}
	}
</script>

{#if error}
	<div
		class="border-destructive/40 bg-destructive/5 text-destructive mx-auto my-2 flex w-fit max-w-full flex-col overflow-hidden rounded-md border shadow-sm"
		role="alert"
	>
		{#if showErrors}
			<div class="overflow-wrap-anywhere p-3 font-mono text-xs wrap-break-word">
				Couldn't evaluate this conditional — the query failed: {error.message}
			</div>
		{:else}
			<div class="p-3 text-xs">This content failed to load</div>
		{/if}
		<div class="border-destructive/20 shrink-0 border-t px-3 py-2">
			<button
				class="text-primary flex items-center gap-1.5 font-sans text-xs font-medium hover:underline"
				onclick={retry}
			>
				Refresh
				<RefreshCw class="size-3 {retrying ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>
{/if}
{@render children?.()}
