<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '../shadcn/utils';

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

		// Extract headings from the page
		const extractHeadings = () => {
			// Look for h1, h2, and h3 headings
			const headingElements = document.querySelectorAll('.prose h1, .prose h2, .prose h3');

			const newHeadings: Heading[] = [];
			const usedIds = new Set<string>();

			headingElements.forEach((heading) => {
				const text = (heading as HTMLElement).innerText?.trim();
				const level = parseInt(heading.tagName.substring(1));

				if (!text) return;

				// Get existing ID or generate one
				let id = heading.getAttribute('id');

				if (!id) {
					// Generate a slug from the text
					id = text
						.toLowerCase()
						.trim()
						.replace(/[^\w\s-]/g, '')
						.replace(/[\s_-]+/g, '-')
						.replace(/^-+|-+$/g, '');

					// Ensure uniqueness
					let uniqueId = id;
					let counter = 1;
					while (usedIds.has(uniqueId)) {
						uniqueId = `${id}-${counter}`;
						counter++;
					}
					id = uniqueId;

					// Set the ID on the element
					heading.setAttribute('id', id);
				}

				usedIds.add(id);
				newHeadings.push({ id, text, level });

				// Add scroll offset for anchor links
				(heading as HTMLElement).style.scrollMarginTop = '6rem';
			});

			// Only update if there's actually a change
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
