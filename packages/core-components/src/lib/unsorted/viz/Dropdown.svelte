<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { profile } from '@evidence-dev/component-utilities/profile';
	import { inputs } from '@evidence-dev/component-utilities/inputs';
	import { browser } from '$app/environment';
	import debounce from 'debounce';
	import { page } from '$app/stores';

	/** @type {string} */
	export let value;

	/** @type {string} */
	export let tag = value;

	/** @type {string} */
	export let from;

	/** @type {string} */
	export let where = 'true';

	/** @type {string} */
	export let name;
	$: component_identifier = `_Dropdown-${name}`;

	const search = browser
		? debounce((query) => profile(db.query, query).then((value) => (data = value)), 200)
		: (query) => (data = profile(db.query, query, component_identifier));

	$: db = $page.data.__db;
	/** @type {{ tag: unknown, value: unknown }[]} */
	$: data = $page.data.data?.[component_identifier] ?? [];
	$: search(`select ${tag} as tag, ${value} as value from ${from} where ${where}`);

	$: selected = data[0]?.value;
	$: $inputs[name] = selected;

	/*
	initial query when db is still loading awaits `database_initialization`, so dummy query works 
	fine as a substitute for weird export stuff
	*/
	let loadingDuckDB = browser;
	$: browser && db.query('SELECT 1').then(() => (loadingDuckDB = false));
</script>

<select disabled={loadingDuckDB} bind:value={selected}>
	{#each data as { tag, value }}
		<option {value}>{tag}</option>
	{/each}
</select>
