<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { getOrCreateRepeatContext } from './repeat-context';
	import { RepeatFilter } from './RepeatFilter.svelte';
	import type { FilterInit } from '../../../Filter.svelte';
	import { getRepeatIterationChain, setRepeatIterationChain } from './repeat-iteration-context';

	type Props = {
		id: string;
		value: unknown;
		column: string;
		children: Snippet;
	};

	const props: Props = $props();
	const id = $derived(props.id);
	const children = $derived(props.children);

	const { filters } = getOrCreateRepeatContext();

	// Items are keyed by value, so an iteration's identity is fixed for its lifetime.
	const chain = untrack(() => [...getRepeatIterationChain(), { id: props.id, value: props.value }]);
	setRepeatIterationChain(chain);

	let filter: RepeatFilter;
	$effect(() => {
		const init: Omit<FilterInit<'repeat', Props>, 'url'> = {
			id,
			userComponentName: 'repeat',
			attributes: untrack(() => props)
		};

		filter = filters.create(init, RepeatFilter);

		return () => {
			filters.remove(filter.id);
		};
	});

	$effect(() => {
		filter.attributes = props;
	});
</script>

{@render children()}
