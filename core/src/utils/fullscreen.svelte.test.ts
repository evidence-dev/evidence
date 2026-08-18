// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createFullscreen } from './fullscreen.svelte';

const mocks = vi.hoisted(() => ({
	afterNavigate: vi.fn(),
	goto: vi.fn(),
	page: { url: new URL('http://localhost/report?fullscreen') }
}));

vi.mock('$app/navigation', () => ({
	afterNavigate: mocks.afterNavigate,
	goto: mocks.goto
}));

vi.mock('$app/state', () => ({
	page: mocks.page
}));

describe('createFullscreen', () => {
	it('exits native fullscreen after navigating away from a fullscreen page', () => {
		const exitFullscreen = vi.fn();
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			value: document.documentElement
		});
		Object.defineProperty(document, 'exitFullscreen', {
			configurable: true,
			value: exitFullscreen
		});

		const cleanup = $effect.root(() => {
			createFullscreen();
		});
		const handleNavigate = mocks.afterNavigate.mock.calls[0][0];

		handleNavigate({
			from: { url: new URL('http://localhost/report?fullscreen') },
			to: { url: new URL('http://localhost/other-page') }
		});

		expect(exitFullscreen).toHaveBeenCalledOnce();
		cleanup();
	});
});
