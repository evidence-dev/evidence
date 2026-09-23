<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { Comment, CommentUser, CommentResponse } from '../../../types/comments';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import { schema } from './schema';
	import { cn } from '../../../shadcn/utils';
	import { fade } from 'svelte/transition';
	import { page as fallbackPage, getPageStateContext } from '../../../shims/page-state';
	import { formatTimeAgo } from '../../../shims/time';
	import { Avatar, AvatarImage, AvatarFallback } from '../../../shadcn/components/ui/avatar';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { getAuthContext } from '../../../shims/auth';
	import Button from '../../../shadcn/components/ui/button/button.svelte';
	import { shortcut } from '@svelte-put/shortcut';
	import DOMPurify from 'dompurify';
	import { untrack } from 'svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';
	import { WORKFLOW_PERIOD_FILTER_ID } from '../../common/reporting-periods';
	import { setupRenderReadiness } from '../../../readiness.svelte';

	type Props = Omit<UserComponentProps<typeof schema>, 'scope'> & {
		scope?: 'page' | 'period';
	};
	const props: Props = $props();
	const page = getPageStateContext() ?? fallbackPage;
	const id = $derived(props.id);
	const placeholder = $derived(props.placeholder ?? 'Add a comment...');
	const className = $derived(props.className);
	const allowedEditors = $derived(props.allowedEditors);
	const title = $derived(props.title);
	const hideEditMetadata = $derived(props.hideEditMetadata);
	const style = $derived(props.style);
	const auth = $state(getAuthContext());
	const pageFilters = getPageFiltersContext();
	const scope = $derived(props.scope ?? 'page');
	const periodFilter = $derived.by(() => {
		const filter = pageFilters?.get(WORKFLOW_PERIOD_FILTER_ID);
		return filter instanceof PeriodFilter ? filter : undefined;
	});
	const scopeError = $derived(
		scope === 'period' && !periodFilter
			? 'Commentary with scope="period" requires workflow.period in the page frontmatter.'
			: undefined
	);
	const identity = $derived.by(() => {
		const projectId = page.data.project?.id as number | undefined;
		const fileId = page.data.page?.id as string | undefined;
		if (!id || !projectId || !fileId || scopeError) return undefined;
		return {
			componentId: id,
			projectId,
			fileId,
			scope,
			...(scope === 'period' && periodFilter
				? { periodGrain: periodFilter.grain, periodKey: periodFilter.period.key }
				: {})
		};
	});

	class CommentaryBucket {
		text = $state<string | null>(null);
		savedText = $state<string | null>(null);
		isSaving = $state(false);
		isLoading = $state(true);
		error = $state<string | undefined>();
		createdAt = $state<Date | null>(null);
		commentUsers = $state<CommentUser[]>([]);
		isEditing = $state(false);
		revision = 0;

		applyComment(comment: Comment | null, preserveDraft = false) {
			this.savedText = comment?.text ? DOMPurify.sanitize(comment.text) : null;
			if (!preserveDraft) this.text = this.savedText;
			this.createdAt = comment?.createdAt ? new Date(comment.createdAt) : null;
			if (comment && !comment.history) return;
			const users = new Map<string, CommentUser>();
			for (const edit of [...(comment?.history ?? [])].reverse()) {
				if (!users.has(edit.user.id)) {
					users.set(edit.user.id, { ...edit.user, createdAt: new Date(edit.createdAt) });
				}
			}
			this.commentUsers = Array.from(users.values());
		}
	}

	const buckets = new Map<string, CommentaryBucket>();
	const bucket = $derived.by(() => {
		if (!identity) return undefined;
		const key = JSON.stringify(identity);
		return untrack(() => {
			let state = buckets.get(key);
			if (!state) {
				state = new CommentaryBucket();
				buckets.set(key, state);
			}
			return state;
		});
	});
	let contentEditableElement = $state<HTMLParagraphElement | null>(null);
	setupRenderReadiness('commentary', () => !bucket?.isLoading);

	const canEdit = $derived(
		page.route.id?.includes('(published)') &&
			!!bucket &&
			(allowedEditors?.includes(auth?.getUser()?.email ?? '') ||
				typeof allowedEditors === 'undefined')
	);

	function focusEditor() {
		if (!canEdit || !bucket || bucket.isSaving) return;
		const editingBucket = bucket;
		bucket.text = bucket.text ? DOMPurify.sanitize(bucket.text) : null;
		bucket.isEditing = true;
		setTimeout(() => {
			if (bucket !== editingBucket || !editingBucket.isEditing) return;
			contentEditableElement?.focus();
			if (contentEditableElement) {
				const range = document.createRange();
				const sel = window.getSelection();
				range.selectNodeContents(contentEditableElement);
				range.collapse(false);
				sel?.removeAllRanges();
				sel?.addRange(range);
			}
		}, 0);
	}

	function cancelEdit() {
		if (!bucket) return;
		bucket.text = bucket.savedText;
		bucket.isEditing = false;
		bucket.error = undefined;
	}

	async function saveComment() {
		if (!canEdit || !identity || !bucket || bucket.isSaving) return;
		const savingBucket = bucket;
		const { componentId, ...request } = identity;
		const text = DOMPurify.sanitize(savingBucket.text ?? '').trim() || null;
		savingBucket.text = text;
		savingBucket.isSaving = true;
		savingBucket.isEditing = false;
		savingBucket.error = undefined;
		savingBucket.revision++;

		try {
			const response = await fetch(`/comments/${encodeURIComponent(componentId)}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ text, ...request })
			});

			const data: CommentResponse = await response.json();
			if (!response.ok) throw new Error(data.error || 'Failed to save comment');
			savingBucket.applyComment(data.comment);
			const user = auth?.getUser();
			if (user && !data.comment?.history) {
				savingBucket.commentUsers = savingBucket.commentUsers.filter(
					(editor) => editor.id !== user.id
				);
				savingBucket.commentUsers.push({
					id: user.id,
					name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
					avatarUrl: user.profilePictureUrl,
					createdAt: savingBucket.createdAt ?? new Date()
				});
			}
		} catch (e) {
			savingBucket.error = e instanceof Error ? e.message : 'Failed to save comment';
			savingBucket.isEditing = true;
		} finally {
			savingBucket.revision++;
			savingBucket.isSaving = false;
		}
	}

	function handleInput(event: Event) {
		if (!bucket) return;
		const target = event.target as HTMLParagraphElement;
		bucket.text = target.innerHTML === '<br>' ? '' : target.innerHTML;
	}

	$effect(() => {
		if (!identity || !bucket) return;
		const loadingBucket = bucket;
		const { componentId, ...request } = identity;
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(request)) params.set(key, String(value));
		const controller = new AbortController();
		const revision = untrack(() => loadingBucket.revision);
		untrack(() => {
			if (!loadingBucket.isEditing && !loadingBucket.isSaving) {
				loadingBucket.isLoading = true;
				loadingBucket.error = undefined;
			}
		});
		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(`/comments/${encodeURIComponent(componentId)}?${params}`, {
					credentials: 'include',
					signal: controller.signal
				});
				const data: CommentResponse = await response.json();
				if (
					controller.signal.aborted ||
					loadingBucket.revision !== revision ||
					loadingBucket.isSaving
				)
					return;
				if (!response.ok) throw new Error(data.error || 'Failed to load comment');
				loadingBucket.applyComment(
					data.comment,
					loadingBucket.isEditing || loadingBucket.text !== loadingBucket.savedText
				);
			} catch (e) {
				if (
					!controller.signal.aborted &&
					loadingBucket.revision === revision &&
					!loadingBucket.isSaving
				) {
					loadingBucket.error = e instanceof Error ? e.message : 'Failed to load comment';
				}
			} finally {
				if (!controller.signal.aborted) loadingBucket.isLoading = false;
			}
		}, 100);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	});
</script>

<svelte:window
	use:shortcut={{
		trigger: [
			{
				key: 'Enter',
				modifier: ['ctrl', 'meta'],
				preventDefault: true,
				callback: () => {
					if (bucket?.isEditing && bucket.savedText !== bucket.text) {
						saveComment();
					}
				}
			},
			{
				key: 'Escape',
				preventDefault: true,
				callback: () => {
					if (bucket?.isEditing) {
						cancelEdit();
					}
				}
			}
		]
	}}
/>

<div class={cn('relative mt-2 mb-4 flex flex-col', className)}>
	{#if scopeError}
		<div role="alert" class="text-xs text-red-500">{scopeError}</div>
	{:else if bucket?.isLoading}
		<div class="animate-pulse">
			<div class="bg-muted mb-2 h-6 w-3/4 rounded"></div>
			<div class="flex items-center gap-2">
				<div class="bg-muted h-4 w-4 rounded-full"></div>
				<div class="bg-muted h-4 w-1/2 rounded"></div>
			</div>
		</div>
	{:else if bucket}
		{#if title}
			<ComponentTitle {title} subtitle="" />
		{/if}
		{#if bucket.isEditing && canEdit}
			<p
				bind:this={contentEditableElement}
				bind:innerHTML={bucket.text}
				contenteditable
				oninput={handleInput}
				class="prose focus:outline-primary mb-2 min-h-[1em] resize-y p-0 text-base
				shadow-none focus:outline-offset-4 {style === 'quote'
					? 'border-muted-foreground/50 border-l-2 pl-2'
					: ''} {!bucket.text?.trim()
					? 'after:text-muted-foreground after:italic after:content-[attr(data-placeholder)]'
					: ''}"
				id={`commentary-${id}`}
				data-placeholder={placeholder}
			></p>
		{:else if bucket.text}
			<div
				class="prose mb-2 min-h-[1em] {style === 'quote'
					? 'border-muted-foreground/50 border-l-2 pl-2'
					: ''} p-0 text-base shadow-none"
			>
				{@html DOMPurify.sanitize(bucket.text)}
			</div>
		{:else if canEdit}
			<Button
				variant="link"
				class="text-muted-foreground mb-2 h-6 justify-start p-0 text-base font-normal italic hover:no-underline"
				onclick={focusEditor}
			>
				{placeholder}
			</Button>
		{/if}
		{#if bucket.error}
			<div role="alert" class="text-xs text-red-500" in:fade>{bucket.error}</div>
		{/if}
		<div
			class="items-center gap-2 {hideEditMetadata === 'print'
				? 'flex print:hidden'
				: hideEditMetadata === 'never'
					? 'flex'
					: hideEditMetadata === 'always'
						? 'hidden'
						: 'flex print:hidden'}"
		>
			{#if bucket.isSaving}
				<div class="text-muted-foreground text-xs" in:fade>Saving...</div>
			{:else if bucket.createdAt}
				<div class="group flex items-center">
					{#each bucket.commentUsers as user, i}
						<Tooltip.Root disableHoverableContent>
							<Tooltip.Trigger>
								<Avatar
									class={`-mr-1 size-4 transition-all duration-300 ${
										i > 0 ? 'group-hover:ml-2' : ''
									}`}
								>
									<AvatarImage src={user.avatarUrl} alt={user.name} />
									<AvatarFallback class="text-xs">
										{user.name?.charAt(0) || 'U'}
									</AvatarFallback>
								</Avatar>
							</Tooltip.Trigger>
							<Tooltip.Content class="evidence-page-theme">
								{user.name}
								<div class="text-muted-foreground text-xs">
									{formatTimeAgo(user.createdAt)}
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				</div>
				<div class="text-muted-foreground text-xs" in:fade>
					<Tooltip.Root>
						<Tooltip.Trigger>
							Edited {formatTimeAgo(bucket.createdAt)}.
						</Tooltip.Trigger>
						<Tooltip.Content class="evidence-page-theme">
							{new Date(bucket.createdAt).toLocaleString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								hour: 'numeric',
								minute: 'numeric',
								hour12: true,
								timeZoneName: 'short'
							})}
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			{/if}
			{#if canEdit && (bucket.text?.trim() || bucket.isEditing) && !bucket.isSaving}
				<div class="flex flex-row print:hidden">
					{#if !bucket.isEditing}
						<Button variant="link" class="h-4 p-0 text-xs" onclick={focusEditor}>Edit</Button>
					{:else}
						<Button
							variant="link"
							class="text-muted-foreground mr-2 h-4 p-0 text-xs"
							onclick={cancelEdit}>Cancel</Button
						>
						{#if bucket.savedText !== bucket.text}
							<Button variant="link" class="h-4 p-0 text-xs" onclick={() => saveComment()}
								>Save</Button
							>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
