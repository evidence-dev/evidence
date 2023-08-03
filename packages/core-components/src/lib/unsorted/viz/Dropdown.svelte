<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { profile } from '@evidence-dev/component-utilities/profile';
	import { inputs } from '@evidence-dev/component-utilities/stores';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

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
	$: component_identifier = `_Dropdown-${name}`;

	const search = browser
		? (query) => profile(db.query, query).then((value) => (data = value))
		: (query) => (data = profile(db.query, query, component_identifier));

	$: db = $page.data.__db;
	/** @type {{ label: unknown, value: unknown }[]} */
	$: data = $page.data.data?.[component_identifier] ?? [];
	$: search(`select (${label}) as label, (${value}) as value from ${from} where (${where})`);
	$: selected = data[0]?.value;
	$: $inputs[name] = selected;

	/*
	initial query when db is still loading awaits `database_initialization`, so dummy query works 
	fine as a substitute for weird export stuff
	*/
	let loadingDuckDB = browser;
	$: browser && db.query('SELECT 1').then(() => (loadingDuckDB = false));
</script>

<!--
	do not switch to binding, select bind:value invalidates its dependencies 
	(so `data` would be invalidated) -->
<select disabled={loadingDuckDB} on:change={(e) => (selected = e.currentTarget.value)}>
	{#each data as { label, value }}
		<option {value}>{label}</option>
	{/each}
</select>
