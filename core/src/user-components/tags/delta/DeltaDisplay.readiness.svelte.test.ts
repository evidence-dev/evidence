// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { PageRenderTracker } from '../../../page-render-tracker.context.svelte';
import DeltaDisplayTrackerTestHarness from './DeltaDisplayTrackerTestHarness.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

// An empty comparison (e.g. no prior-period rows) used to hold a task open forever,
// stalling scheduled PDFs until the renderer's timeout.
describe('DeltaDisplay PDF readiness', () => {
	it.each([null, undefined, 0.12])('leaves no pending task for value %s', (value) => {
		const tracker = new PageRenderTracker();
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(DeltaDisplayTrackerTestHarness, { target, props: { tracker, value } });
		flushSync();

		expect(tracker.pendingCount).toBe(0);
		if (value == null) expect(target.textContent).toContain('–');
	});
});
