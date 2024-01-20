<script>
	import { Button } from '../../atoms/button';
	import { Plus } from '@evidence-dev/component-utilities/icons';
	import { createEventDispatcher, getContext } from 'svelte';
	import { scale } from 'svelte/transition';

	const dispatch = createEventDispatcher();
	const readonly = getContext('__adhoc_readonly');

	let expanded = false;
</script>

{#if !readonly}
	<div class="w-full flex gap-4 items-center h-12">
		<hr class="flex-1" />

		<div
			class="
		border rounded-[1.5rem] h-8 w-8
		hover:h-12
		hover:rounded-lg transition-all
		group
		flex
		justify-between items-center hover:w-56 hover:px-2 duration-200
	"
			on:mouseenter={() => (expanded = true)}
			on:mouseleave={() => (expanded = false)}
		>
			{#if expanded}
				<div
					class="flex justify-center gap-1 w-full"
					transition:scale={{ duration: 300, delay: 100 }}
				>
					<Button
						icon={Plus}
						iconPosition="left"
						on:click={() =>
							dispatch('addBlock', {
								type: 'query',
								id: Math.random().toString() /* "Good enough" */,
								title: 'new_query'
							})}
						size="sm"
						outline
					>
						Query
					</Button>
					<Button
						icon={Plus}
						iconPosition="left"
						on:click={() =>
							dispatch('addBlock', {
								type: 'chart',
								id: Math.random().toString() /* "Good enough" */,
								title: 'New Chart',
								chartType: 'line'
							})}
						size="sm"
						outline
					>
						Chart
					</Button>
					<Button
						icon={Plus}
						iconPosition="left"
						on:click={() =>
							dispatch('addBlock', {
								type: 'note',
								id: Math.random().toString() /* "Good enough" */
							})}
						size="sm"
						outline
					>
						Note
					</Button>
				</div>
			{/if}
		</div>

		<hr class="flex-1" />
	</div>
{/if}
