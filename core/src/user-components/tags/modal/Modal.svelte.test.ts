// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import ModalTestHarness from './ModalTestHarness.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	document.body.innerHTML = '';
});

describe('modal page settings', () => {
	it('carries the page down_is_good into the modal body', async () => {
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(ModalTestHarness, { target, props: { settings: { down_is_good: true } } });
		flushSync();

		target.querySelector('button')!.click();
		await tick();

		const delta = document.body.querySelector('[role="dialog"] span');
		expect(delta?.className).toContain('text-(--theme-negative)');
	});
});
