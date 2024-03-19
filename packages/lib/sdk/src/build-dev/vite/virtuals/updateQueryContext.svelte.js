import { ALL_QUERIES_MUTS_CONTEXT_KEY, QUERIES_CONTEXT_KEY } from '$evidence/contextKeys';
import { getContext, setContext } from 'svelte';
import { derived, writable } from 'svelte/store';

export default () => {
	/** @type {import("svelte/store").Readable<Record<string,string>>} */
	const parent = getContext(QUERIES_CONTEXT_KEY);

	const { push, rm } = getContext(ALL_QUERIES_MUTS_CONTEXT_KEY);
	/** @type {string} */
	let id;
	/*
		These stores are created in a closure so that the references in context remain the same
		The returned function is set up to make reactivity easier
	*/
	const write = writable({});
	const childQueries = derived([parent, write], ([$parent, $write]) => ({
		...$parent,
		...$write
	}));
	setContext(QUERIES_CONTEXT_KEY, childQueries);

	/** @param {Record<string,string>} layerQueries */
	return (layerQueries) => {
		write.set(layerQueries);
		// todo: handle removal of all queries on dismount
		if (id) rm(id);

		id = push(layerQueries);
	};
};
