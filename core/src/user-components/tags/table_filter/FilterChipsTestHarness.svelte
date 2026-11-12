<script lang="ts">
	import { untrack } from 'svelte';
	import { setLocaleContext } from '../../../locale/locale.context.svelte';
	import { setFilterContext } from './filterUtils.svelte';
	import FilterChips from './FilterChips.svelte';
	import type { ColumnFilter } from './types';

	let { language, filters }: { language: string | null; filters: ColumnFilter[] } = $props();

	untrack(() => {
		setLocaleContext(language);
		const filterState = setFilterContext('orders');
		filterState.filters = filters;
		filterState.active = true;
	});
</script>

<FilterChips data="orders" />
