import { dev } from '$app/env';
import { writable } from 'svelte/store';
import { browser } from '$app/env';

// Persist ShowQueries user choice
export const showQueries = writable(dev && browser && (localStorage.getItem('showQueries')!='false'));
showQueries.subscribe((value) => browser && (localStorage.setItem('showQueries',(value))));
export const pageHasQueries = writable(false);