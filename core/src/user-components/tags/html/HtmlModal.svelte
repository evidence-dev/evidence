<script lang="ts">
	/**
	 * Full-page modal opened by an {% html %} block via `evidence.modal.open()`.
	 * The PARENT renders the dialog chrome (backdrop dim, viewport centering,
	 * scroll-lock, close button) so it can cover the whole page; the modal's
	 * `html` runs in a NESTED HtmlSandbox — a second opaque-origin frame with the
	 * same CSP and the same `evidence.*` context (data/theme/filters) as the
	 * block. So the content stays sandboxed (never injected into the trusted
	 * parent realm) yet can be anything a block can: styled markup, a chart, its
	 * own `evidence.query`. It autosizes to its content.
	 *
	 * Open is TWO-WAY bound (`bind:open`) — the proven controlled pattern the
	 * built-in {% modal %} uses. A one-way `open` prop let bits-ui's internal
	 * state diverge and dismiss on open. `onInteractOutside` is also prevented
	 * (close via × / Esc / evidence.modal.close only) because the nested iframe
	 * trips Radix's outside-interaction detection. The block iframe that held
	 * focus when open() fired is blurred parent-side (see Html.svelte) so Radix's
	 * focus guard doesn't read it as "focus outside" and close.
	 */
	import * as Dialog from '../../../shadcn/components/ui/dialog/index.js';
	import HtmlSandbox from './sandbox/HtmlSandbox.svelte';
	import HtmlLoadingShell from './HtmlLoadingShell.svelte';
	import { MODAL_HTML_LOADING_FALLBACK_MS } from './html-loading';
	import { Viewport } from '../../../preview-viewport.context.svelte';
	import { cn } from '../../../shadcn/utils';
	import type {
		HtmlVariables,
		HtmlThemeSnapshot,
		HtmlFiltersSnapshot,
		HtmlQueryResponse
	} from './sandbox/html-protocol';
	import type { SandboxLogEntry } from '../../sandbox/log-protocol';

	type Props = {
		open: boolean;
		title?: string;
		/** Modal body HTML+JS, rendered in a nested sandbox. */
		html: string;
		/** Shared block context so the modal's sandbox has the same data/theme/filters. */
		variables: HtmlVariables;
		theme: HtmlThemeSnapshot;
		filters: HtmlFiltersSnapshot;
		printing?: boolean;
		runQuery: (name: string) => Promise<HtmlQueryResponse>;
		onFilterSet?: (id: string, value: unknown) => void;
		onFilterCreate?: (id: string, value: unknown, column?: string) => void;
		onNavigate?: (path: string) => void;
		/** Links out of the modal — same allowed hosts as the block that opened it. */
		onOpenUrl?: (url: string) => void;
		onLog?: (entry: SandboxLogEntry) => void;
	};
	let {
		open = $bindable(false),
		title,
		html,
		variables,
		theme,
		filters,
		printing = false,
		runQuery,
		onFilterSet,
		onFilterCreate,
		onNavigate,
		onOpenUrl,
		onLog
	}: Props = $props();

	// The nested sandbox takes a beat to boot (load runtime, inject, autosize),
	// which reads as an empty flash. HtmlLoadingShell holds "Loading…" until
	// onRendered (or the short modal fallback). Bump loadGeneration only when
	// opening so a close animation doesn't flash the placeholder again.
	const viewport = new Viewport();
	let loadGeneration = $state(0);
	$effect(() => {
		if (!open) return;
		loadGeneration += 1;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class={cn(
			'evidence-page-theme flex max-h-[85vh] w-[calc(100%-2rem)] flex-col sm:max-w-[720px]',
			viewport.simulatingMobile && 'max-h-[85%] sm:max-w-[calc(100%-2rem)]'
		)}
		onInteractOutside={(e) => e.preventDefault()}
		portalProps={{ to: viewport.portalTo }}
	>
		{#if title}
			<Dialog.Header class="shrink-0">
				<Dialog.Title>{title}</Dialog.Title>
			</Dialog.Header>
		{:else}
			<Dialog.Title class="sr-only">Details</Dialog.Title>
		{/if}
		<!-- No inner {#if open}: the sandbox is tied to Dialog.Content's own mount
		     lifecycle (only present while open, and KEPT through the close
		     animation) so the content doesn't collapse to empty and flash as the
		     dialog animates out. A fresh frame still boots on each open. min-h
		     keeps the dialog a stable size while the content loads. -->
		<HtmlLoadingShell
			fallbackMs={MODAL_HTML_LOADING_FALLBACK_MS}
			resetKey={`${loadGeneration}:${html}`}
			class="min-h-[10rem] flex-1 overflow-y-auto"
		>
			{#snippet children({ onRendered })}
				<HtmlSandbox
					{html}
					{variables}
					{theme}
					{filters}
					{printing}
					{runQuery}
					{onFilterSet}
					{onFilterCreate}
					{onNavigate}
					{onOpenUrl}
					{onLog}
					{onRendered}
					class="w-full"
				/>
			{/snippet}
		</HtmlLoadingShell>
	</Dialog.Content>
</Dialog.Root>
