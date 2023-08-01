import { getContext, setContext } from 'svelte';

const USQL_CONTEXT_KEY = 'EVIDENCE_USQL_DB_INSTANCE';

export const getUsqlContext = () => getContext(USQL_CONTEXT_KEY);
export const setUsqlContext = (db) => setContext(USQL_CONTEXT_KEY, db);
