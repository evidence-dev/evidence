import { getContext, setContext } from 'svelte';

/**
 * The viewer's resolved engine attribute values ({ name → value }, the
 * engine's bind order already applied: user → group → default). Set by the
 * render surfaces of QEv3 orgs so page TEXT can print `{{attr}}` with the
 * viewer's own data — the SQL path never reads this (the engine binds there).
 */
const ENGINE_ATTRIBUTE_VALUES_CONTEXT_KEY = Symbol('ENGINE_ATTRIBUTE_VALUES');

export const setEngineAttributeValuesContext = (values: Record<string, unknown>) => {
	setContext(ENGINE_ATTRIBUTE_VALUES_CONTEXT_KEY, values);
};

export const getEngineAttributeValuesContext = (): Record<string, unknown> | undefined =>
	getContext<Record<string, unknown> | undefined>(ENGINE_ATTRIBUTE_VALUES_CONTEXT_KEY);
