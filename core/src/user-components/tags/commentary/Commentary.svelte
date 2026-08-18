<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type {
		Comment,
		CommentUser,
		CommentResponse,
		CommentHistory
	} from '../../../types/comments';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import { schema } from './schema';
	import { cn } from '../../../shadcn/utils';
	import { fade } from 'svelte/transition';
	import { page } from '../../../shims/page-state';
	import { formatTimeAgo } from '../../../shims/time';
	import { Avatar, AvatarImage, AvatarFallback } from '../../../shadcn/components/ui/avatar';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { getAuthContext } from '../../../shims/auth';
	import Button from '../../../shadcn/components/ui/button/button.svelte';
	import { shortcut } from '@svelte-put/shortcut';
	import DOMPurify from 'dompurify';

	const props: UserComponentProps<typeof schema> = $props();
	const id = $derived(props.id);
	const placeholder = $derived(props.placeholder ?? 'Add a comment...');
	const className = $derived(props.className);
	const allowedEditors = $derived(props.allowedEditors);
	const title = $derived(props.title);
	const hideEditMetadata = $derived(props.hideEditMetadata);
	const style = $derived(props.style);
	const auth = $state(getAuthContext());

	let text = $state<string | null>(null);
	let currentText = $state<string | null>(null);
	let isSaving = $state(false);
	let isLoading = $state(true);
	let error = $state<string | undefined>(undefined);
	let createdAt = $state<Date | null>(null);
	let idTimeout: ReturnType<typeof setTimeout> | null = null;
	let commentUsers = $state<CommentUser[]>([]);
	let isEditing = $state(false);
	let contentEditableElement = $state<HTMLParagraphElement | null>(null);

	const canEdit = $derived(
		allowedEditors?.includes(auth?.getUser()?.email ?? '') || typeof allowedEditors === 'undefined'
	);

	const isOnPublishedPage = $derived(page.route.id?.includes('(published)'));

	function focusEditor() {
		text = DOMPurify.sanitize(text ?? '');
		currentText = text;
		isEditing = true;
		setTimeout(() => {
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
		text = currentText;
		isEditing = false;
	}

	async function saveComment() {
		isSaving = true;
		isEditing = false;
		error = undefined;

		if (!text?.trim()) {
			isSaving = false;
			return;
		}

		try {
			const response = await fetch(`/comments/${id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					text: text?.trim() || null,
					projectId: page.data.project?.id,
					fileId: page.data.page?.id
				})
			});

			if (!isOnPublishedPage) {
				throw new Error('Comments can only be saved from published pages.');
			}

			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Failed to save comment');

			createdAt = new Date();
			const user = auth?.getUser();
			if (user) {
				const newUser: CommentUser = {
					id: user.id,
					name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
					avatarUrl: user.profilePictureUrl,
					createdAt: new Date()
				};

				// Remove any existing entry for this user and add the new one at the end
				commentUsers = [...commentUsers.filter((u) => u.id !== user.id), newUser];
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save comment';
		} finally {
			isSaving = false;
		}
	}

	async function fetchComment(
		id: string,
		projectId: number,
		fileId: string
	): Promise<Comment | null> {
		const response = await fetch(`/comments/${id}?projectId=${projectId}&fileId=${fileId}`, {
			credentials: 'include'
		});

		const data: CommentResponse = await response.json();
		if (!response.ok) throw new Error(data.error || 'Failed to load comment');

		return data.comment;
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		text = target.innerHTML === '<br>' ? '' : target.innerHTML;
	}

	$effect(() => {
		if (idTimeout) clearTimeout(idTimeout);
		idTimeout = setTimeout(() => {
			if (id && page.data.project?.id && page.data.page?.id) {
				isLoading = true;
				error = undefined;

				fetchComment(id, page.data.project.id, page.data.page.id)
					.then((comment) => {
						if (comment) {
							text = comment.text;
							createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
							// Initialize with all users from history, keeping only the most recent edit per user
							const userMap = new Map<string, CommentUser>();
							// Process history in reverse to get the most recent edit for each user
							[...comment.history].reverse().forEach((edit: CommentHistory) => {
								const editDate = new Date(edit.createdAt);
								if (!userMap.has(edit.user.id)) {
									userMap.set(edit.user.id, {
										...edit.user,
										createdAt: editDate
									});
								}
							});
							// Convert to array - users will be in order of their most recent edit
							commentUsers = Array.from(userMap.values());
						}
					})
					.catch((e) => {
						error = e instanceof Error ? e.message : 'Failed to load comment';
					})
					.finally(() => {
						isLoading = false;
					});
			} else {
				isLoading = false;
			}
		}, 100); // Debounce for 100ms

		return () => {
			if (idTimeout) clearTimeout(idTimeout);
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
					if (isEditing && currentText !== text) {
						saveComment();
					}
				}
			},
			{
				key: 'Escape',
				preventDefault: true,
				callback: () => {
					if (isEditing) {
						cancelEdit();
					}
				}
			}
		]
	}}
/>

<div class={cn('relative mt-2 mb-4 flex flex-col', className)}>
	{#if isLoading}
		<div class="animate-pulse">
			<div class="bg-muted mb-2 h-6 w-3/4 rounded"></div>
			<div class="flex items-center gap-2">
				<div class="bg-muted h-4 w-4 rounded-full"></div>
				<div class="bg-muted h-4 w-1/2 rounded"></div>
			</div>
		</div>
	{:else}
		{#if title}
			<ComponentTitle {title} subtitle="" />
		{/if}
		{#if isEditing}
			<p
				bind:this={contentEditableElement}
				bind:innerHTML={text}
				contenteditable
				oninput={handleInput}
				class="prose focus:outline-primary mb-2 min-h-[1em] resize-y p-0 text-base
				shadow-none focus:outline-offset-4 {style === 'quote'
					? 'border-muted-foreground/50 border-l-2 pl-2'
					: ''} {!text?.trim()
					? 'after:text-muted-foreground after:italic after:content-[attr(data-placeholder)]'
					: ''}"
				id={`commentary-${id}`}
				data-placeholder={placeholder}
			></p>
		{:else if text}
			<div
				class="prose mb-2 min-h-[1em] {style === 'quote'
					? 'border-muted-foreground/50 border-l-2 pl-2'
					: ''} p-0 text-base shadow-none"
			>
				{@html DOMPurify.sanitize(text)}
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
		<!-- Edit metadata -->
		<div
			class="items-center gap-2 {hideEditMetadata === 'print'
				? 'flex print:hidden'
				: hideEditMetadata === 'never'
					? 'flex'
					: hideEditMetadata === 'always'
						? 'hidden'
						: 'flex print:hidden'}"
		>
			{#if error}
				<div class="text-xs text-red-500" in:fade>{error}</div>
			{:else if isSaving}
				<div class="text-muted-foreground text-xs" in:fade>Saving...</div>
			{:else if createdAt}
				<div class="group flex items-center">
					{#each commentUsers as user, i}
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
							Edited {formatTimeAgo(createdAt)}.
						</Tooltip.Trigger>
						<Tooltip.Content class="evidence-page-theme">
							{new Date(createdAt).toLocaleString('en-US', {
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
			{#if canEdit && text?.trim() && !isSaving}
				<div class="flex flex-row print:hidden">
					{#if !isEditing}
						<Button variant="link" class="h-4 p-0 text-xs" onclick={focusEditor}>Edit</Button>
					{:else}
						<Button
							variant="link"
							class="text-muted-foreground mr-2 h-4 p-0 text-xs"
							onclick={cancelEdit}>Cancel</Button
						>
						{#if currentText !== text}
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
