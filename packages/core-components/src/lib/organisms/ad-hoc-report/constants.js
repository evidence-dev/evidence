import { getContext, setContext } from 'svelte';

export const LOCAL_STORAGE_KEY = '__evidence_adhoc_report';

export const setReadonly = (readonly) => setContext('__adhoc_readonly', readonly);
export const getReadonly = () => getContext('__adhoc_readonly');
