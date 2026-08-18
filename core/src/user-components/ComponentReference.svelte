<script lang="ts">
	import { Card } from '../shadcn/components/ui/card';
	import { ChevronDownIcon, SearchIcon } from 'lucide-svelte';
	import { config as markdocConfig } from '../markdoc/config';
	import AttributeCard from './AttributeCard.svelte';

	let searchQuery = $state('');

	function highlightText(text: string, query: string) {
		if (!query) return text;
		const regex = new RegExp(`(${query})`, 'gi');
		return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-900">$1</span>');
	}

	// Load tags and create items
	let filteredItems = $derived(
		Object.entries(markdocConfig.tags)
			.filter(([_name, tag]) => !tag.deprecated && !tag.undocumented)
			.map(([name, tag]) => {
				const item = {
					name,
					attributes: tag.attributes ?? {},
					description: tag.description ?? '',
					selfClosing: tag.selfClosing ?? false
				};

				if (!searchQuery) return { ...item, score: 0 };

				const query = searchQuery.toLowerCase();
				let score = 0;

				// Exact name matches get highest priority (score 4)
				if (item.name.toLowerCase() === query) {
					score += 10;
				}
				// Partial name matches get high priority (score 3)
				else if (item.name.toLowerCase().includes(query)) {
					score += 3;
				}

				// Description matches get medium priority (score 2)
				if (item.description.toLowerCase().includes(query)) {
					score += 2;
				}

				// Attribute matches get lowest priority (score 1)
				const hasMatchingAttributes = Object.entries(item.attributes).some(([attrName, attr]) => {
					return (
						attrName.toLowerCase().includes(query) ||
						(attr.description?.toLowerCase() ?? '').includes(query) ||
						(attr.type?.toString().toLowerCase() ?? '').includes(query) ||
						(attr.default?.toString().toLowerCase() ?? '').includes(query) ||
						(attr.matches?.toString().toLowerCase() ?? '').includes(query)
					);
				});

				if (hasMatchingAttributes) {
					score += 1;
				}

				return { ...item, score };
			})
			.filter((item) => !searchQuery || item.score > 0)
			.sort((a, b) => {
				if (searchQuery) {
					// When searching, sort by score (descending) then alphabetically
					return b.score - a.score || a.name.localeCompare(b.name);
				}
				// When not searching, just sort alphabetically
				return a.name.localeCompare(b.name);
			})
	);

	let getMatchingAttributes = (item: (typeof filteredItems)[0]) => {
		const query = searchQuery.toLowerCase();
		return Object.entries(item.attributes).filter(([name, attr]) => {
			return (
				name.toLowerCase().includes(query) ||
				(attr.description?.toLowerCase() ?? '').includes(query) ||
				(attr.type?.toString().toLowerCase() ?? '').includes(query) ||
				(attr.default?.toString().toLowerCase() ?? '').includes(query) ||
				(attr.matches?.toString().toLowerCase() ?? '').includes(query)
			);
		});
	};

	let expandedSections = $state<Record<string, boolean>>({});
	let collapsedByUser = $state<Record<string, boolean>>({});

	$effect(() => {
		// Reset user toggles when search changes
		if (searchQuery) {
			collapsedByUser = {};
		}
	});
</script>

<div class="mx-auto max-w-7xl px-8 py-4 pt-5">
	<div class="mb-4">
		<h1 class="text-2xl font-semibold">Component Reference</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			Documentation for available Markdown Components
		</p>
	</div>

	<div class="mb-4">
		<div class="relative">
			<SearchIcon class="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search for components, attributes, etc."
				class="bg-background w-full rounded-md border px-8 py-2 text-sm"
			/>
		</div>
	</div>

	<div class="space-y-4 pb-4">
		{#each filteredItems as item}
			<Card class="p-2 pt-4">
				<div>
					<div>
						<div class="flex items-center gap-2 px-2">
							<a id={item.name} href={`#${item.name}`} class="scroll-mt-6 text-xl font-semibold">
								{@html highlightText(
									item.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
									searchQuery
								)}
							</a>
							<h2 class="text-muted-foreground font-mono text-base select-all">
								{@html highlightText('{% ' + item.name + ' /%}', searchQuery)}
							</h2>
						</div>
						<p class="text-muted-foreground my-1 px-2 text-sm">
							{@html highlightText(item.description, searchQuery)}
						</p>
					</div>

					<div>
						<button
							class="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-sm font-semibold"
							onclick={() =>
								(expandedSections[`${item.name}-example`] =
									!expandedSections[`${item.name}-example`])}
						>
							<span>Example</span>
							<ChevronDownIcon
								class="size-4 -rotate-90 transition-transform {expandedSections[
									`${item.name}-example`
								]
									? 'rotate-0'
									: ''}"
							/>
						</button>
						{#if expandedSections[`${item.name}-example`]}
							<div class="bg-muted mt-2 rounded-md p-4">
								<pre class="text-sm"><code
										>{@html highlightText(
											item.selfClosing
												? `{% ${item.name}${Object.entries(item.attributes)
														.filter(([_, attr]) => attr.required)
														.map(([attrName, attr]) => {
															if (attr.type === Array) {
																return `\n\t${attrName}=[]`;
															} else if (attr.type === String) {
																return `\n\t${attrName}=""`;
															} else if (attr.type === Number || attr.type === Boolean) {
																return `\n\t${attrName}=`;
															} else {
																return `\n\t${attrName}={}`;
															}
														})
														.join('')} \n/%}`
												: `{% ${item.name}${Object.entries(item.attributes)
														.filter(([_, attr]) => attr.required)
														.map(([attrName, attr]) => {
															if (attr.type === Array) {
																return `\n\t${attrName}=[]`;
															} else if (attr.type === String) {
																return `\n\t${attrName}=""`;
															} else if (attr.type === Number || attr.type === Boolean) {
																return `\n\t${attrName}=`;
															} else {
																return `\n\t${attrName}={}`;
															}
														})
														.join('')}\n%}\n\t...\n{% /${item.name} %}`,
											searchQuery
										)}</code
									></pre>
							</div>
						{/if}
					</div>

					{#if Object.keys(item.attributes).length > 0}
						<div>
							<button
								class="hover:bg-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-sm font-semibold"
								onclick={() => {
									if (searchQuery && getMatchingAttributes(item).length > 0) {
										collapsedByUser[item.name] = !collapsedByUser[item.name];
									} else {
										expandedSections[item.name] = !expandedSections[item.name];
									}
								}}
							>
								<span>Attributes</span>
								<ChevronDownIcon
									class="size-4 -rotate-90 transition-transform {!collapsedByUser[item.name] &&
									(expandedSections[item.name] ||
										(searchQuery && getMatchingAttributes(item).length > 0))
										? 'rotate-0'
										: ''}"
								/>
							</button>
							{#if !collapsedByUser[item.name] && (expandedSections[item.name] || (searchQuery && getMatchingAttributes(item).length > 0))}
								<div class="mt-2 space-y-2">
									{#each Object.entries(item.attributes) as [name, attr]}
										<AttributeCard {name} {attr} {searchQuery} />
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</div>
