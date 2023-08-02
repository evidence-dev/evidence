<script context="module">
	export const evidenceInclude = true;

	let identifier = 0;
</script>

<script>
	import { profile } from '@evidence-dev/component-utilities/profile';
	import { getUsqlContext } from '@evidence-dev/component-utilities/usqlContext';
	import { browser } from '$app/environment';
	import debounce from 'debounce';
	import { page } from '$app/stores';

	// should be deterministic? as long as there's no async
	const component_identifier = `_dropdown_${identifier++}`;

	/** @type {string} */
	export let value;

	/** @type {string} */
	export let tag = value;

	/** @type {string} */
	export let from;

	/** @type {string} */
	export let where = 'true';

	const db = getUsqlContext();

	const search = browser
		? debounce((query) => profile(db.query, query).then((value) => (data = value)), 200)
		: (query) => (data = profile(db.query, query, component_identifier));

	/** @type {{ tag: unknown, value: unknown }[]} */
	$: data = $page.data.data?.[component_identifier] ?? [];
	$: search(`select ${tag} as tag, ${value} as value from ${from} where ${where}`);
	$: selected = data[0]?.value;
</script>

<select bind:value={selected}>
	{#each data as { tag, value }}
		<option {value}>{tag}</option>
	{/each}
</select>
