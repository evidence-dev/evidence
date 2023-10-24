<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { page } from '$app/stores';
	import { getContext, setContext } from 'svelte';
	import { QueryStore } from '@evidence-dev/query-store';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/**
	 * (optional) Label above the dropdown
	 * @type {string}
	 */
	export let label;

	/**
	 * Column to be used as value when selected
	 * @type {string}
	 */
	export let value;

	/**
	 * (optional) Column to be used as label for each value
	 * @type {string}
	 */
	export let value_label = value;

	/**
	 * Table or subquery to select from
	 * @type {string}
	 */
	export let from;
	// checks for select and a whitespace after
	$: if (/select\s/i.test(from)) {
		from = `(${from})`;
	}

	/**
	 * (optional) Where clause for dataset
	 * @type {string}
	 */
	export let where = 'true';

	/**
	 * (optional) Order by clause for dataset
	 * @type {string}
	 */
	export let order = 'select null';

	/** @type {string} */
	export let name;
	setContext('dropdown_context', {
		hasBeenSet: false,
		setSelectedValue: (selected) => ($inputs[name] = selected)
	});

	$: component_identifier = `Dropdown-${name}`;

	$: hasQuery = value && from;

	/** @type {QueryStore} */
	let data;
	$: hasQuery &&
		(data = new QueryStore(
			`select distinct on (value, label)
				${value_label} as label,
				${value} as value
			from ${from} where (${where}) order by (${order})`,
			(query, query_name) => $page.data.__db.query(query, { query_name }),
			component_identifier,
			{ initialData: $page.data.data?.[component_identifier] }
		));

	/** @type {unknown} */
	let selected;
	$: hasQuery && (selected = $data[0]?.value);
	$: $inputs[name] = selected;
</script>

<!-- pretty span made with tailwind -->
{#if label}<span class="text-sm text-gray-500 block">{label}</span>{/if}

<!--
	do not switch to binding, select bind:value invalidates its dependencies 
	(so `data` would be invalidated) -->
<select disabled={hasQuery && !$data.loaded} on:change={(e) => (selected = e.currentTarget.value)}>
	<slot />

	{#if hasQuery}
		{#each $data as { label, value }}
			<option {value}>{label}</option>
		{/each}
	{/if}
</select>
