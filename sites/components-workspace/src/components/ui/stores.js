import { dev } from '$app/env';
import { writable } from 'svelte/store';

export const showQueries = writable(dev);