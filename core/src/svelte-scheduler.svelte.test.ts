// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import EachRegistryFixture from './test-utils/EachRegistryFixture.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

// Svelte <5.57.1 froze the whole app after the first update here (sveltejs/svelte#18508).
it('keeps updating when each-block items are read from outside their block', async () => {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(EachRegistryFixture, { target });
	flushSync();
	await tick();

	const button = target.querySelector('button')!;
	const values = () =>
		['row', 'mirror', 'outside']
			.map((id) => target!.querySelector(`[data-testid="${id}"]`)?.textContent)
			.join(',');

	expect(values()).toBe('0,0,0');

	for (const n of [1, 2, 3]) {
		button.click();
		await tick();
		expect(values()).toBe(`${n},${n},${n}`);
	}
});
