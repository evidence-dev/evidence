<script>
	import { Tabs } from 'bits-ui';
	import Accordion from '../atoms/accordion/Accordion.svelte';
	import AccordionItem from '../atoms/accordion/AccordionItem.svelte';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputStore = getInputContext();

	$: keys = Object.keys($inputStore);
</script>

<Accordion class="fixed bottom-0 right-0 left-0 px-2 bg-white border-t">
	<AccordionItem
		title="{keys?.length} Input{keys?.length === 1 ? '' : 's'}"
		class="text-xs border-none"
	>
		<Tabs.Root>
			<Tabs.List class="flex pt-1 overflow-x-auto">
				{#each keys as input}
					<Tabs.Trigger
						value={input}
						class="text-gray-900 border-b border-white font-medium font-mono data-[state=active]:bg-gray-800 hover:bg-gray-100 data-[state=active]:text-gray-50 data-[state=active]:border-gray-600 px-3 py-1 rounded-t transition-colors duration-100"
					>
						inputs.{input}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#each keys as input}
				<Tabs.Content value={input}>
					<pre
						class="text-xs font-mono bg-gray-800 text-gray-50 rounded-b rounded-tr p-4 h-64 overflow-auto text-xs">{JSON.stringify(
							$inputStore[input],
							null,
							2
						)}
SQL Auto Fragment: {$inputStore[input]}
					</pre>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</AccordionItem>
</Accordion>
