/**
 * Sidepane state shim for @evidence/core
 *
 * Provides a simple writable store for sidepane collapsed state.
 * Studio persists this to localStorage; the shim provides a simple in-memory store.
 */
import { writable } from 'svelte/store';

// Default: open/visible (not collapsed)
export const sidepaneCollapsed = writable(false);
