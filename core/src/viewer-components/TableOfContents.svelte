<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '../shadcn/utils';
	import { getRendererOutline } from '../user-components/Renderer/tree-registry';
	import type { OutlineSection } from '../print-outline/resolve-outline';

	interface Props {
		backgroundColor?: string;
	}

	let { backgroundColor = 'bg-background' }: Props = $props();

	interface Heading {
		id: string;
		text: string;
		level: number;
	}

	let headings = $state<Heading[]>([]);

	onMount(() => {
		let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

		// Resolving the outline runs warehouse queries, so never start a second run while one is in
		// flight; a request made meanwhile reruns once it finishes.
		let extracting = false;
		let rerunRequested = false;
		let disposed = false;

		// Headings come from the markup outline (repeats expanded, variables resolved, print-only
		// content dropped); the DOM only supplies anchors, so unmounted sections are skipped.
		const extractHeadings = async () => {
			if (disposed) return;
			if (extracting) {
				rerunRequested = true;
				return;
			}
			extracting = true;
			try {
				await extractHeadingsOnce();
			} finally {
				extracting = false;
				if (rerunRequested && !disposed) {
					rerunRequested = false;
					extractHeadings();
				}
			}
		};

		const extractHeadingsOnce = async () => {
			const root = document.querySelector<HTMLElement>('[data-markdoc-content]');
			const resolve = root ? getRendererOutline(root) : undefined;
			if (!root || !resolve) return;

			let outline: OutlineSection[];
			try {
				outline = await resolve('screen');
			} catch {
				return;
			}
			if (disposed) return;

			const mountedHeadings = new Map<string, HTMLElement>();
			for (const el of root.querySelectorAll<HTMLElement>('[data-section-key]')) {
				const key = el.dataset.sectionKey;
				if (key && !mountedHeadings.has(key)) mountedHeadings.set(key, el);
			}

			const newHeadings: Heading[] = [];
			const usedIds = new Set<string>();

			for (const section of outline) {
				const heading = mountedHeadings.get(section.id);
				if (!heading) continue;
				const text = section.label;

				let id = heading.getAttribute('id');

				if (!id) {
					id = text
						.toLowerCase()
						.trim()
						.replace(/[^\w\s-]/g, '')
						.replace(/[\s_-]+/g, '-')
						.replace(/^-+|-+$/g, '');

					let uniqueId = id;
					let counter = 1;
					while (usedIds.has(uniqueId)) {
						uniqueId = `${id}-${counter}`;
						counter++;
					}
					id = uniqueId;

					heading.setAttribute('id', id);
				}

				usedIds.add(id);
				newHeadings.push({ id, text, level: section.level });

				heading.style.scrollMarginTop = '6rem';
			}

			const hasChanged =
				newHeadings.length !== headings.length ||
				newHeadings.some((h, i) => h.id !== headings[i]?.id || h.text !== headings[i]?.text);

			if (hasChanged) {
				headings = newHeadings;
			}
		};

		// Debounced version to avoid excessive updates
		const debouncedExtract = () => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => {
				extractHeadings();
			}, 300);
		};

		// Initial extraction with retry for async content
		let retryCount = 0;
		const maxRetries = 8;
		const retryDelays = [50, 100, 200, 300, 500, 800, 1200, 2000];

		function tryExtract() {
			extractHeadings();

			// Keep retrying as content may still be loading
			if (retryCount < maxRetries) {
				retryTimeouts.push(
					setTimeout(() => {
						retryCount++;
						tryExtract();
					}, retryDelays[retryCount])
				);
			}
		}

		const retryTimeouts: ReturnType<typeof setTimeout>[] = [];
		tryExtract();

		// Watch for any changes in the prose content
		const observer = new MutationObserver(() => {
			debouncedExtract();
		});

		const proseElement = document.querySelector('.prose');
		if (proseElement) {
			observer.observe(proseElement, {
				childList: true,
				subtree: true,
				characterData: true,
				characterDataOldValue: false
			});
		}

		return () => {
			disposed = true;
			rerunRequested = false;
			retryTimeouts.forEach((timeout) => clearTimeout(timeout));
			if (debounceTimeout) clearTimeout(debounceTimeout);
			observer.disconnect();
		};
	});
</script>

{#if headings.length > 0}
	<nav>
		<p
			class={cn(
				'text-primary sticky top-0 flex items-center gap-1.5 pb-2 text-xs font-medium tracking-wide',
				backgroundColor
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-3.5"
			>
				<path d="M15 18H3"></path>
				<path d="M17 6H3"></path>
				<path d="M21 12H3"></path>
			</svg>
			On this page
		</p>
		<div class="text-muted-foreground flex flex-col text-xs font-normal">
			{#each headings as heading (heading.id)}
				{#if heading.level === 1}
					<a
						href="#{heading.id}"
						class={cn(
							'text-muted-foreground sticky top-6 pt-6 pb-1 font-medium tracking-wide underline-offset-1 first:pt-3 hover:underline',
							backgroundColor
						)}
					>
						{heading.text}
					</a>
				{:else if heading.level === 2}
					<a href="#{heading.id}" class="mt-2.5 hover:underline">
						{heading.text}
					</a>
				{:else if heading.level === 3}
					<a href="#{heading.id}" class="mt-2 pl-3 hover:underline">
						{heading.text}
					</a>
				{/if}
			{/each}
		</div>
	</nav>
{/if}
