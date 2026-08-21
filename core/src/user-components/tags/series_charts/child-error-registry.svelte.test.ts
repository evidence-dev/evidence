// @vitest-environment jsdom — runes ($state/$effect) need a reactive runtime
import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { createChildErrorRegistry } from './child-error-registry.svelte';

/** Run `fn` in an effect root, flush, tear down; return any thrown error. */
function runRoot(fn: () => void): unknown {
	let threw: unknown;
	try {
		const cleanup = $effect.root(fn);
		flushSync();
		cleanup();
	} catch (error) {
		threw = error;
	}
	return threw;
}

describe('createChildErrorRegistry', () => {
	it('registering from inside an $effect does not blow the effect depth', () => {
		let registrations = 0;
		const threw = runRoot(() => {
			const registry = createChildErrorRegistry();
			// Mirrors ReferencePointDynamic: register the child's error getter.
			$effect(() => {
				registrations++;
				return registry.register(() => 'boom');
			});
			// Mirrors ComboChart: derive the surfaced error and push it to state.
			let surfaced: string | null | undefined;
			const first = $derived(registry.firstError);
			$effect(() => {
				surfaced = first;
			});
			void surfaced;
		});
		expect(threw).toBeUndefined();
		expect(registrations).toBe(1); // ran once, not in a loop
	});

	it('firstError reactively reflects registered getters and their live values', () => {
		const child = $state<{ error: string | null }>({ error: null });
		let seen: string | null | undefined;
		const cleanup = $effect.root(() => {
			const registry = createChildErrorRegistry();
			registry.register(() => child.error); // stand-in for () => query.error
			const first = $derived(registry.firstError);
			$effect(() => {
				seen = first;
			});
		});
		flushSync();
		expect(seen).toBeUndefined(); // no error yet

		child.error = 'query failed';
		flushSync();
		expect(seen).toBe('query failed'); // read side stayed reactive

		cleanup();
	});

	it('disposer removes the getter so a stale child stops surfacing', () => {
		let seen: string | null | undefined;
		const cleanup = $effect.root(() => {
			const registry = createChildErrorRegistry();
			const dispose = registry.register(() => 'boom');
			const first = $derived(registry.firstError);
			$effect(() => {
				seen = first;
			});
			flushSync();
			expect(seen).toBe('boom');
			dispose();
		});
		flushSync();
		expect(seen).toBeUndefined();
		cleanup();
	});
});
