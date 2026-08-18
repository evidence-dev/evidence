<script lang="ts" module>
	export const COMPONENT_WRAPPER_CLASS = 'component-wrapper';
</script>

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { Check, X, HelpCircle, Download, Loader, LoaderCircle } from 'lucide-svelte';
	import type { UserComponentSchemaWithComponentWrapper } from '../types';
	import { setComponentWrapperContext } from './component-wrapper-context';
	import type { Snippet } from 'svelte';
	import { dev, browser } from '../../shims/env';
	import { cn } from '../../shadcn/utils';
	import { getRendererContext } from '../Renderer/renderer-context';
	import type { Tag, ValidateError } from '@markdoc/markdoc';
	import { getPageSettingsContext } from '../../page-settings.context';
	import { getFlexConfig } from '../Renderer/getFlexConfig';
	import { getQueryInfoContext } from '../../query-info-context.svelte';
	import { downloadAsExcel, getExcelExportNames } from '../../shims/data-export';
	import { getCardContext, setCardContext } from './card-context.svelte';
	import { getComponentClickToSourceContext } from '../../component-click-to-source.context.svelte';
	import { normalizeSourceFile, readCallSiteStamp } from './call-site-stamp';
	import { getPrintModeContext } from '../../print-mode.context';
	import { getShowErrorsContext } from '../../show-errors.context';
	import {
		ContextMenu,
		ContextMenuContent,
		ContextMenuItem,
		ContextMenuTrigger
	} from '../../shadcn/components/ui/context-menu';
	import { sidepaneCollapsed } from '../../shims/sidepane-state';
	import { logger } from '../../shims/logger';
	type Props = {
		schema: UserComponentSchemaWithComponentWrapper;
		props: Record<string, unknown>;
		children: Snippet;
		validationErrors: ValidateError[];
		tag: Tag;
	};

	const { schema, props, children, validationErrors, tag }: Props = $props();

	let error = $state();
	let validationError = $derived(validationErrors.find((err) => err.error.level !== 'warning'));
	let delayedAllPropsValid = $state(false);

	// Use renderer context (set by Renderer.svelte) to detect route type.
	// Do NOT use page.route.id here — this file is in core which doesn't have
	// access to the real SvelteKit page store. The page shim returns null for route.id.
	const rendererContext = getRendererContext();
	let isEditRoute = $derived(rendererContext.context === 'edit');

	// Show error overlays when the consuming app opts in via context
	const showErrors = getShowErrorsContext();
	let displayError = $derived(showErrors ? (validationError?.error?.message ?? error) : null);

	// Determine if this component should use compact error behavior (hide children on error, show compact error badge)
	const hasCompactErrorBehavior = $derived(
		schema.componentWrapper.display === 'inline' ||
			(schema.componentWrapper.display === 'block' &&
				schema.componentWrapper.compactErrors === true)
	);

	// Function to handle Fix in Chat button click
	function handleFixInChat(error: string, componentType: string) {
		if (!browser) return; // Only run in browser to avoid SSR issues

		// Include line number for easier identification
		const location = tag.location;
		const lineInfo = location?.start ? ` (line ${location.start.line + 1})` : '';

		const message = `I am seeing the following error in my ${componentType} component${lineInfo}. Please propose an edit to my page as concisely as possible:\n\n${error}`;

		// Open the sidepane
		sidepaneCollapsed.set(false);

		// Switch to chat tab in sidepane
		document.dispatchEvent(new CustomEvent('switchToChat'));

		// Find and focus the chat input using ID instead of placeholder
		const inputRef = document.querySelector('#chat-input');
		if (inputRef instanceof HTMLTextAreaElement) {
			inputRef.focus();
			// Set the value directly
			inputRef.value = message;
			// Trigger an input event to ensure Svelte picks up the change
			inputRef.dispatchEvent(new Event('input', { bubbles: true }));

			// Auto-submit the message by simulating Enter key press
			setTimeout(() => {
				const enterEvent = new KeyboardEvent('keydown', {
					key: 'Enter',
					code: 'Enter',
					keyCode: 13,
					which: 13,
					bubbles: true,
					cancelable: true
				});
				inputRef.dispatchEvent(enterEvent);
			}, 100); // Small delay to ensure the input event is processed first
		}
	}

	const isValidProp = (value: unknown) => {
		return value !== undefined && value !== null && value !== '';
	};

	const requiredProps = $derived(
		Object.entries(schema.attributes)
			.filter(([_, definition]) => definition.required === true)
			.map(([name, _definition]) => ({
				name,
				valid: isValidProp(props[name])
			}))
	);

	const allPropsValid = $derived(requiredProps.every((prop) => prop.valid));
	const hasRequiredProps = $derived(requiredProps.length > 0);
	const shouldShowRequiredProps = $derived(
		hasRequiredProps && !delayedAllPropsValid && isEditRoute
	);

	// Derived value to determine if children should be rendered
	const shouldRenderChildren = $derived(
		schema.componentWrapper.display !== 'inline' || !shouldShowRequiredProps || delayedAllPropsValid
	);

	// Update delayedAllPropsValid with a delay when allPropsValid changes
	$effect(() => {
		if (allPropsValid) {
			setTimeout(() => {
				delayedAllPropsValid = true;
			}, 200); // Delay of 800ms to allow for checkmark animation
		} else {
			delayedAllPropsValid = false;
		}
	});

	let customExportHandler = $state<(() => Promise<void>) | undefined>(undefined);

	setComponentWrapperContext({
		getComponentId: () => componentId,
		setError: (newError: string | undefined) => {
			error = newError;
		},
		hasBlockingErrors: () =>
			validationErrors?.some((err) => err.error.level !== 'warning') ?? false,
		setCustomExportHandler: (handler: (() => Promise<void>) | undefined) => {
			customExportHandler = handler;
		}
	});

	// Get query info context to access component query data
	const queryInfoContext = getQueryInfoContext();
	// Source-location-derived ID for deterministic matching between client and
	// server, and to enable AI chat to match components by source position.
	// Format: "[file::]line-character" from tag.location. Partials parse with
	// their own source coordinates, so we prepend the partial file path when
	// present to keep IDs unique across the document.
	const sourceComponentId = $derived.by(() => {
		if (!tag.location?.start) return null;
		const { line, character = 0 } = tag.location.start;
		const file = tag.location.file;
		return file ? `${file}::${line}-${character}` : `${line}-${character}`;
	});
	// Synthetic wrappers (Markdoc-injected `row` / `conditional`) have no source
	// location. Fall back to the runtime counter for internal use (map keys,
	// context) but DON'T stamp them onto the DOM — they'd show up as useless
	// entries in PDF outline / other tools that walk `[data-component-id]`.
	const componentId = $derived(sourceComponentId ?? tag.id);
	const queryInfo = $derived(queryInfoContext?.queryInfoMap.get(componentId));
	const isRefreshing = $derived(queryInfo?.query?.refreshing ?? false);

	// Check if this component can have downloadable data (has a 'data' attribute in schema)
	const hasData = $derived('data' in schema.attributes && queryInfo?.query.result?.rows?.length);

	let downloadingData = $state(false);

	// Function to download component data as Excel
	async function downloadComponentData() {
		if (!browser) return;

		try {
			downloadingData = true;
			if (customExportHandler) {
				await customExportHandler();
			} else {
				const exportNames = getExcelExportNames({
					title: queryInfo?.title,
					fallbackFilename: `${schema.render}_data`
				});

				// default export behavior
				await downloadAsExcel({
					...exportNames,
					data: queryInfo?.query?.result?.rows ?? [],
					columns: queryInfo?.query?.result?.columns
				});
			}
		} catch (error) {
			logger.error(error, 'Error downloading component data');
		} finally {
			downloadingData = false;
			contextMenuOpen = false;
		}
	}

	// Long press support for mobile context menu
	let longPressTimer: ReturnType<typeof setTimeout> | undefined = $state();
	let contextMenuOpen = $state(false);

	function handleTouchStart(event: TouchEvent) {
		// Only handle touch events for components that can have downloadable data
		if (!hasData) return;

		// Clear any existing timer
		if (longPressTimer) {
			clearTimeout(longPressTimer);
		}

		// Start long press timer (500ms)
		longPressTimer = setTimeout(() => {
			// Dispatch custom event for ECharts to hide tooltips
			const target = event.target as Element;
			target?.dispatchEvent(
				new CustomEvent('longpress', {
					detail: { action: 'contextmenu' },
					bubbles: true
				})
			);

			// Only trigger context menu if there's data to download
			if (queryInfo?.query?.result?.rows?.length) {
				contextMenuOpen = true;
			}
			// Prevent any default touch behavior
			event.preventDefault();
		}, 500);
	}

	function handleTouchEnd() {
		// Clear the timer if touch ends before long press duration
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = undefined;
		}
	}

	function handleTouchMove() {
		// Cancel long press if user moves finger
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = undefined;
		}
	}

	// Dismiss the download menu on any interaction outside the menu itself. bits-ui
	// deliberately excludes clicks on the ContextMenuTrigger from its own outside-click
	// dismissal — but here the trigger IS the whole viz, so clicks on the chart would
	// never close it. It also never closes on scroll, which strands the menu on mobile.
	$effect(() => {
		if (!contextMenuOpen || !browser) return;

		const closeIfOutside = (event: Event) => {
			const target = event.target as Element | null;
			if (target?.closest('[data-slot="context-menu-content"]')) return;
			contextMenuOpen = false;
		};
		const close = () => {
			contextMenuOpen = false;
		};

		document.addEventListener('pointerdown', closeIfOutside, true);
		window.addEventListener('scroll', close, true);
		window.addEventListener('wheel', close, { passive: true });
		document.addEventListener('touchmove', close, { passive: true });

		return () => {
			// removeEventListener matches only on the capture flag (false here), so the
			// add-only `passive` option is intentionally omitted.
			document.removeEventListener('pointerdown', closeIfOutside, true);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('wheel', close);
			document.removeEventListener('touchmove', close);
		};
	});

	// Only used for debugging
	const debugDataAttributes = $derived(
		dev
			? {
					'data-user-component': schema.render // helps keep track of user components in the DOM
				}
			: {}
	);

	const pageSettingsGetter = getPageSettingsContext();
	const parentCardContext = getCardContext();
	const clickToSourceContext = getComponentClickToSourceContext();
	const isPrintMode = getPrintModeContext();

	// Determine if this component is wrapped in a card
	const isCard = $derived(
		pageSettingsGetter().cards &&
			!('noCard' in schema.componentWrapper && schema.componentWrapper.noCard) &&
			!parentCardContext?.insideCard
	);

	// Set card context for children, combining parent context with this component's card state
	// If parent already says we're in a card, preserve that
	// Otherwise, set based on whether this component adds a card
	setCardContext({
		get insideCard(): boolean {
			return Boolean(parentCardContext?.insideCard) || Boolean(isCard);
		}
	});

	const flexConfig = $derived(getFlexConfig(tag));

	let isModifierKeyHeld = $state(false);
	const isHighlighted = $derived(clickToSourceContext?.highlightedComponentId() === componentId);
	let componentElement: HTMLElement | undefined = $state();

	$effect(() => {
		if (isHighlighted && componentElement) {
			requestAnimationFrame(() => {
				componentElement?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				});
			});
		}
	});

	// The lines/location to jump to on cmd+click — in the coordinates of the
	// document open in the editor, or null when this node has no line there.
	// A node inlined from a custom component or partial keeps ITS OWN file's
	// parse coordinates (load-bearing elsewhere); jumping to those numbers in
	// the host page's editor lands on an unrelated line. The inlining
	// transforms stamp the call-site position (see call-site-stamp.ts), so:
	//   - node parsed from the open document → its own lines (also covers
	//     editing a component file, where the preview's inlined nodes ARE in
	//     the open document)
	//   - inlined + call site in the open document → the call-site lines
	//   - otherwise → no jump (better than a wrong one)
	function sourceJumpTarget(): { lines?: number[]; line?: number } | null {
		const currentFile = normalizeSourceFile(clickToSourceContext?.currentFile?.() ?? null);
		const tagFile = normalizeSourceFile(tag.location?.file);

		if (tagFile === null || tagFile === currentFile) {
			return { lines: tag.lines, line: tag.location?.start?.line };
		}
		const stamp = readCallSiteStamp(tag.attributes);
		if (stamp) {
			const stampFile = normalizeSourceFile(stamp.file);
			// null = the main rendered document, which is the open one.
			if (stampFile === null || stampFile === currentFile) {
				return { lines: stamp.lines };
			}
		}
		return null;
	}

	function handleComponentClick(event: MouseEvent) {
		if (!isEditRoute || !clickToSourceContext) return;
		if (!(event.metaKey || event.ctrlKey)) return;
		event.stopPropagation();

		const target = sourceJumpTarget();
		if (!target) return;
		if (target.lines && target.lines.length >= 2) {
			const startLine = target.lines[0] + 1;
			const endLine = target.lines.length === 4 ? target.lines[3] : target.lines[1];
			clickToSourceContext.scrollToLineRange(startLine, endLine);
		} else if (target.line !== undefined) {
			clickToSourceContext.scrollToLine(target.line + 1);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (isEditRoute && clickToSourceContext && (event.metaKey || event.ctrlKey)) {
			isModifierKeyHeld = true;
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		if (event.key === 'Meta' || event.key === 'Control') {
			isModifierKeyHeld = false;
		}
	}

	const styles = $derived.by(() => {
		if (!flexConfig) return {};

		const hasWidth = 'width' in props && typeof props.width === 'number';

		return {
			minSize: `
			min-width: ${flexConfig.minWidth}px;
			min-height: ${flexConfig.minHeight}px;
			`,
			flex: `
			flex-grow: ${hasWidth ? '0' : flexConfig.grow};
			flex-shrink: 0;
			flex-basis: ${hasWidth ? `${props.width}%` : '0px'};
		`
		};
	});

	// Compute the complete style string, only including width when it's defined
	const computedStyle = $derived.by(() => {
		let styleStr = styles.flex || '';

		// Only add width if props.width is actually defined and is a number
		if ('width' in props && typeof props.width === 'number') {
			styleStr += `; width: ${props.width}%;`;
		} else if (schema.componentWrapper.display === 'inline') {
			// Inline components sit in a shrink-to-fit inline-block. The inner flex
			// wrapper's max-width:100% makes the box's automatic width resolve through
			// a circular percentage path and collapse to ~min-content (each word wraps,
			// following text overlaps). A definite content-based width breaks that loop.
			// Set via inline style, not a `w-fit` utility — Tailwind doesn't emit that
			// class for this component, so the class silently no-ops.
			styleStr += '; width: fit-content;';
		}

		return styleStr;
	});
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div
	bind:this={componentElement}
	class={cn(
		COMPONENT_WRAPPER_CLASS,
		'relative',
		props.print_break !== 'auto' && 'break-inside-avoid',
		schema.componentWrapper.display === 'none' && 'mt-0 mb-0',
		schema.componentWrapper.display === 'inline' && 'inline-block',
		schema.componentWrapper.display === 'block' && [
			// Only apply w-fit when there's no flex config or when width is explicitly set
			schema.componentWrapper.width === 'fit' &&
				(!flexConfig || ('width' in props && typeof props.width === 'number')) &&
				'w-fit',
			schema.componentWrapper.width === 'full' && 'w-full',
			isCard && 'bg-card p-card-pad rounded-md border',
			isCard && !isPrintMode && 'shadow-xs'
		],
		isEditRoute && clickToSourceContext && isModifierKeyHeld && 'cursor-pointer',
		isEditRoute &&
			isHighlighted && [
				'component-highlight-overlay transition-all duration-150',
				schema.componentWrapper.display === 'inline' && 'px-1 py-0.5'
			]
	)}
	style={computedStyle}
	{...debugDataAttributes}
	data-width={props.width}
	data-render={schema.render}
	data-component-id={sourceComponentId ?? undefined}
	data-component-type={schema.render}
	data-component-title={typeof props.title === 'string' && props.title ? props.title : undefined}
	data-pdf-hidden={tag.attributes['data-pdf-hidden'] !== undefined ? '' : undefined}
	onclick={handleComponentClick}
	title={isEditRoute && clickToSourceContext && isModifierKeyHeld
		? 'Cmd/Ctrl + Click to jump to source code'
		: undefined}
>
	{#if isRefreshing}
		<div class="absolute top-2 right-2 z-20" transition:fade={{ duration: 200 }}>
			<LoaderCircle class="text-muted-foreground h-4 w-4 animate-spin [animation-duration:1s]" />
		</div>
	{/if}
	<!-- Inline components (value, delta, sparkline, …) live inside a shrink-to-fit
		 inline-block in a paragraph: a width:100% (size-full) inner makes the box
		 resolve through a circular flex/percentage path that under-measures the
		 content (visible as following text overlapping the value, esp. with wide
		 monospace fonts). Inline must size to content; block keeps size-full. -->
	<div
		class={cn(
			'flex flex-col *:flex-1 print:h-auto',
			schema.componentWrapper.display === 'inline' ? 'max-w-full' : 'size-full'
		)}
		style={styles.minSize}
	>
		<!-- The context-menu trigger and region divs sit between the flex wrapper
			 (*:flex-1 above) and the component root; without h-full they resolve to
			 content height and break the chain that lets charts fill cards and
			 stretched rows. Charts only: tables and other h-full-rooted components
			 stay top-aligned with content-hugging height. -->
		<ContextMenu bind:open={contextMenuOpen}>
			<ContextMenuTrigger
				disabled={!hasData}
				class={schema.componentWrapper.display === 'block' && schema.category === 'chart'
					? 'h-full'
					: undefined}
			>
				<div
					role="region"
					class={schema.componentWrapper.display === 'block' && schema.category === 'chart'
						? 'h-full'
						: undefined}
					oncontextmenu={(_e: MouseEvent) => {
						// Only show context menu for components that can have downloadable data
						if (!hasData) {
							return;
						}
					}}
					ontouchstart={handleTouchStart}
					ontouchend={handleTouchEnd}
					ontouchmove={handleTouchMove}
					ontouchcancel={handleTouchEnd}
				>
					{#if shouldRenderChildren}
						{#if hasCompactErrorBehavior}
							<span class:hidden={displayError}>
								{@render children()}
							</span>
						{:else}
							{@render children()}
						{/if}
					{/if}

					{#if shouldShowRequiredProps}
						{#if schema.componentWrapper.display === 'block'}
							<div
								class="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-sm backdrop-blur-sm"
								in:fade={{ duration: 300 }}
								out:fade={{ duration: 300 }}
							>
								<div
									class="bg-card m-0 max-w-md min-w-1/2 rounded-md border px-3 pb-3 font-mono shadow-md"
								>
									<p class="mt-3 mb-1 text-xs font-bold">Required</p>
									<ul class="m-0 p-0 text-xs">
										{#each requiredProps as prop (prop.name)}
											<li class="flex items-center justify-between p-0">
												<span class="font-mono">{prop.name}</span>
												{#if prop.valid}
													<div in:scale={{ duration: 500, start: 0.2 }}>
														<Check class="h-4 w-4 text-green-500" />
													</div>
												{:else}
													<X class="h-4 w-4 text-red-500" />
												{/if}
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{:else}
							<span
								class="bg-card mr-1 inline-flex items-center rounded-md border px-2 py-1 font-mono text-xs whitespace-nowrap shadow-sm"
								in:fade={{ duration: 300 }}
							>
								<span class="font-bold">Required:</span>
								{#each requiredProps as prop (prop.name)}
									<span class="ml-1 inline-flex items-center gap-1">
										<span class="font-mono">{prop.name}</span>
										{#if prop.valid}
											<span in:scale={{ duration: 500, start: 0.2 }}>
												<Check class="inline-block h-4 w-4 text-green-500" />
											</span>
										{:else}
											<X class="inline-block h-4 w-4 text-red-500" />
										{/if}
									</span>
								{/each}
							</span>
						{/if}
					{:else if displayError}
						{#if hasCompactErrorBehavior}
							<span
								class="group border-destructive/40 bg-destructive/10 text-destructive relative mx-1 inline-flex cursor-help items-center justify-between rounded-md border px-1.5 py-0 align-text-top font-mono text-xs whitespace-nowrap shadow-sm"
								in:fade={{ duration: 300 }}
								style="padding-top: 0.05rem; padding-bottom: 0.05rem;"
							>
								<span class="pr-1.5 font-semibold">Error</span>
								<HelpCircle class="inline-block h-3.5 w-3.5" />
								<span
									class="bg-card text-card-foreground invisible absolute top-full left-1/2 z-20 flex max-h-48 w-64 -translate-x-[35px] translate-y-1 transform flex-col overflow-hidden rounded-md border text-xs wrap-break-word whitespace-normal shadow-md group-hover:visible before:absolute before:inset-x-0 before:-top-1 before:h-1 before:bg-transparent before:content-[''] hover:visible"
									style="animation-delay: 0ms; transition: visibility 0ms 200ms, opacity 300ms ease-in-out;"
								>
									<div class="overflow-wrap-anywhere flex-1 overflow-y-auto p-2">
										{displayError}
									</div>
									{#if isEditRoute && displayError}
										<div class="border-border/50 shrink-0 border-t px-2 py-1.5">
											<button
												class="text-primary font-sans text-xs font-medium hover:underline"
												onclick={() => handleFixInChat(String(displayError), schema.render)}
											>
												Fix in Chat →
											</button>
										</div>
									{/if}
								</span>
							</span>
						{:else}
							<div
								class="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-sm backdrop-blur-sm"
								transition:fade={{ duration: 300, delay: 500 }}
							>
								<div
									class="border-destructive/40 bg-destructive/5 text-destructive mx-1 my-2 flex max-h-48 max-w-full flex-col overflow-hidden rounded-md border font-mono shadow-sm"
								>
									<div
										class="overflow-wrap-anywhere flex-1 overflow-y-auto p-3 text-xs wrap-break-word"
									>
										{displayError}
									</div>
									{#if isEditRoute && displayError}
										<div class="border-destructive/20 shrink-0 border-t px-3 pb-1">
											<button
												class="text-primary font-sans text-xs font-medium hover:underline"
												onclick={() => handleFixInChat(String(displayError), schema.render)}
											>
												Fix in Chat →
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem
					onclick={downloadComponentData}
					class="flex cursor-pointer items-center gap-2"
					disabled={downloadingData}
				>
					{#if downloadingData}
						<Loader class="size-4 animate-spin" />
					{:else}
						<Download class="size-4" />
					{/if}
					Download Data
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	</div>
</div>

<style>
	/* Overlay highlight that sits on top of all nested content */
	:global(.component-highlight-overlay::before) {
		content: '';
		position: absolute;
		inset: 0;
		background-color: rgba(254, 240, 138, 0.25); /* yellow-200 at 25% */
		pointer-events: none;
		z-index: 10;
		transition: opacity 150ms;
	}

	:global(.dark .component-highlight-overlay::before) {
		background-color: rgba(250, 204, 21, 0.15); /* yellow-400 at 15% for dark mode */
	}
</style>
