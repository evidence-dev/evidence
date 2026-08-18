// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { tick } from 'svelte';
import {
	ComponentErrorSource,
	SandboxRuntimeErrorsContext
} from './sandbox-runtime-errors-context.svelte';
import type { SandboxLogEntry } from './sandbox/log-protocol';

function entry(overrides: Partial<SandboxLogEntry> = {}): SandboxLogEntry {
	return {
		level: 'error',
		source: 'script',
		message: 'boom',
		...overrides
	};
}

describe('ComponentErrorSource', () => {
	it('stamps each entry with componentId, componentType, and a timestamp', () => {
		const source = new ComponentErrorSource('chart-7', 'custom_echart');
		const before = Date.now();
		source.report(entry({ message: 'first' }));
		const after = Date.now();

		expect(source.entries).toHaveLength(1);
		const stamped = source.entries[0];
		expect(stamped.componentId).toBe('chart-7');
		expect(stamped.componentType).toBe('custom_echart');
		expect(stamped.message).toBe('first');
		expect(stamped.at).toBeGreaterThanOrEqual(before);
		expect(stamped.at).toBeLessThanOrEqual(after);
	});

	it('caps entries at 20 (per-source) and drops the oldest when exceeded', () => {
		const source = new ComponentErrorSource('chart-7', 'custom_echart');
		for (let i = 0; i < 25; i++) source.report(entry({ message: `msg-${i}` }));

		expect(source.entries).toHaveLength(20);
		expect(source.entries[0].message).toBe('msg-5');
		expect(source.entries[19].message).toBe('msg-24');
	});

	it('clear() empties the entries; no-op when already empty', () => {
		const source = new ComponentErrorSource('chart-7', 'custom_echart');
		source.report(entry());
		source.report(entry());
		source.clear();
		expect(source.entries).toEqual([]);

		// Calling clear() on an empty source must NOT replace the array reference
		// (the loop bug from the prior design). Capture the reference, clear,
		// assert identity.
		const ref = source.entries;
		source.clear();
		expect(source.entries).toBe(ref);
	});

	it('report() inside a $effect does NOT self-feedback-loop on the entries array', async () => {
		// Defensive: report mutates entries via push/shift, which internally
		// read entries.length. Without untrack, a $effect that calls report
		// would subscribe to entries — and the push itself would re-run the
		// effect. Currently called only from event handlers, but the bug class
		// is silent until exercised, so guard at the source.
		const source = new ComponentErrorSource('chart-7', 'custom_echart');
		let runs = 0;
		const cleanup = $effect.root(() => {
			$effect(() => {
				runs++;
				source.report(entry({ message: `r-${runs}` }));
			});
		});
		await tick();
		expect(runs).toBe(1);
		expect(source.entries).toHaveLength(1);
		cleanup();
	});

	it('clear() inside a $effect does NOT self-feedback-loop on the entries array', async () => {
		// Same defense as report() — clear reads entries.length to decide
		// whether to reassign. The CustomEChart caller wraps in untrack too,
		// but defending here means future callers don't have to know.
		const source = new ComponentErrorSource('chart-7', 'custom_echart');
		source.report(entry());
		let runs = 0;
		const cleanup = $effect.root(() => {
			$effect(() => {
				runs++;
				source.clear();
			});
		});
		await tick();
		expect(runs).toBe(1);
		expect(source.entries).toHaveLength(0);
		cleanup();
	});
});

describe('SandboxRuntimeErrorsContext', () => {
	it('returns a Source from register that the caller pushes entries to', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		const source = ctx.register('a', 'custom_echart');
		source.report(entry({ message: 'hello' }));

		expect(ctx.snapshot().map((e) => e.message)).toEqual(['hello']);
		expect(ctx.size).toBe(1);
	});

	it('snapshot folds entries from all registered sources together', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		const a = ctx.register('a', 'custom_echart');
		const b = ctx.register('b', 'html');
		a.report(entry({ message: 'a-1' }));
		b.report(entry({ message: 'b-1' }));
		a.report(entry({ message: 'a-2' }));

		const snap = ctx.snapshot();
		// Entries appear in registration-then-insertion order — what matters
		// is the union is complete and componentType is preserved.
		expect(snap.map((e) => e.message).sort()).toEqual(['a-1', 'a-2', 'b-1']);
		const types = new Map(snap.map((e) => [e.componentId, e.componentType]));
		expect(types.get('a')).toBe('custom_echart');
		expect(types.get('b')).toBe('html');
	});

	it('unregister drops one component from the snapshot, others unaffected', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		const a = ctx.register('a', 'custom_echart');
		const b = ctx.register('b', 'custom_echart');
		a.report(entry({ message: 'a-1' }));
		b.report(entry({ message: 'b-1' }));

		ctx.unregister('a');

		expect(ctx.snapshot().map((e) => e.message)).toEqual(['b-1']);
		expect(ctx.size).toBe(1);
	});

	it('unregistering an unknown id is a no-op', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		ctx.register('a', 'custom_echart');
		expect(() => ctx.unregister('nonexistent')).not.toThrow();
		expect(ctx.size).toBe(1);
	});

	it('snapshot is a fresh array each call (caller cannot mutate the buffer)', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		const source = ctx.register('a', 'custom_echart');
		source.report(entry());

		const snap1 = ctx.snapshot();
		snap1.push({} as never);
		const snap2 = ctx.snapshot();

		expect(snap2).toHaveLength(1);
		expect(snap1).not.toBe(snap2);
	});

	it('fires the report listener on every entry across all registered sources', () => {
		// Production telemetry hook: the studio layer attaches a listener that
		// emits a posthog `sandbox-error` event. We test the contract here.
		const ctx = new SandboxRuntimeErrorsContext();
		const reported: { componentType: string; message: string }[] = [];
		ctx.setReportListener((e) => reported.push({ componentType: e.componentType, message: e.message }));

		const a = ctx.register('a', 'custom_echart');
		const b = ctx.register('b', 'html');
		a.report(entry({ message: 'a-1' }));
		b.report(entry({ message: 'b-1' }));

		expect(reported).toEqual([
			{ componentType: 'custom_echart', message: 'a-1' },
			{ componentType: 'html', message: 'b-1' }
		]);
	});

	it('a thrown listener does not break the report path (entries still stored)', () => {
		// Listener failures (network blip, posthog not loaded) must never lose
		// an entry for the AI's debug_code view.
		const ctx = new SandboxRuntimeErrorsContext();
		ctx.setReportListener(() => {
			throw new Error('telemetry down');
		});

		const source = ctx.register('a', 'custom_echart');
		expect(() => source.report(entry({ message: 'still recorded' }))).not.toThrow();
		expect(ctx.snapshot()).toHaveLength(1);
	});

	it('register inside a $effect does NOT self-feedback-loop on the source map', async () => {
		// Regression: register both reads and writes the internal #sources
		// $state map (clones the current map, mutates the clone, reassigns).
		// Without untrack on the read, calling register from inside a $effect
		// subscribes the caller to #sources — and register's own write then
		// re-runs the effect, looping until Svelte throws
		// effect_update_depth_exceeded. CustomEChart hits this on mount.
		const ctx = new SandboxRuntimeErrorsContext();
		let runs = 0;
		const cleanup = $effect.root(() => {
			$effect(() => {
				runs++;
				ctx.register(`comp-${runs}`, 'custom_echart');
			});
		});
		await tick();
		// Without the guard this would be >1 (effect re-runs, registers a
		// second component, that triggers another re-run, etc., until Svelte
		// gives up). With the guard: exactly one register, exactly one run.
		expect(runs).toBe(1);
		expect(ctx.size).toBe(1);
		cleanup();
	});

	it('unregister inside a $effect cleanup does NOT loop', async () => {
		// Same hazard as register — unregister also reads + writes #sources.
		const ctx = new SandboxRuntimeErrorsContext();
		ctx.register('comp', 'custom_echart');
		let cleanupRuns = 0;
		const cleanup = $effect.root(() => {
			$effect(() => {
				return () => {
					cleanupRuns++;
					ctx.unregister('comp');
				};
			});
		});
		await tick();
		cleanup();
		expect(cleanupRuns).toBe(1);
		expect(ctx.size).toBe(0);
	});

	it('re-registering an id replaces the prior source (HMR / remount semantics)', () => {
		const ctx = new SandboxRuntimeErrorsContext();
		const first = ctx.register('a', 'custom_echart');
		first.report(entry({ message: 'old' }));

		const second = ctx.register('a', 'custom_echart');
		second.report(entry({ message: 'new' }));

		// Only the second source's entries are reachable via snapshot.
		expect(ctx.snapshot().map((e) => e.message)).toEqual(['new']);
		expect(ctx.size).toBe(1);
	});
});
