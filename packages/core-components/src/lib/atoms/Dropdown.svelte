<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { page } from '$app/stores';
	import { getContext, setContext } from 'svelte';
	import { QueryStore } from '@evidence-dev/query-store';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/** @type {string} */
	export let value;

	/** @type {string} */
	export let label = value;

	/** @type {string} */
	export let from;
	// checks for select and a whitespace after
	$: if (/select\s/i.test(from)) {
		from = `(${from})`;
	}

	/** @type {string} */
	export let where = 'true';

	/** @type {string} */
	export let name;
	setContext('dropdown_context', {
		hasBeenSet: false,
		setSelectedValue: (selected) => ($inputs[name] = selected)
	});

	$: component_identifier = `Dropdown-${name}`;

	$: data = new QueryStore(
		`select (${label}) as label, (${value}) as value from ${from} where (${where})`,
		(query, query_name) => $page.data.__db.query(query, { query_name }),
		component_identifier,
		{ initialData: $page.data.data?.[component_identifier] }
	);

	$: selected = $data[0]?.value;
	$: $inputs[name] = selected;
</script>

<!--
	do not switch to binding, select bind:value invalidates its dependencies 
	(so `data` would be invalidated) -->
<select disabled={!$data.loaded} on:change={(e) => (selected = e.currentTarget.value)}>
	<slot />

	{#each $data as { label, value }}
		<option {value}>{label}</option>
	{/each}
</select>
