<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { getOrCreateRepeatContext } from './repeat-context';
	import { RepeatFilter } from './RepeatFilter.svelte';
	import type { FilterInit } from '../../../Filter.svelte';

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
