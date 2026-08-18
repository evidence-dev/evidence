import { describe, expect, it } from 'vitest';
import { SANDBOX_RUNTIMES, SANDBOX_SERVE_DIR } from './sandbox-runtimes.js';
import { SANDBOX_RUNTIME_PATH as ECHART_RUNTIME_PATH } from '../tags/custom_echart/sandbox/sandbox-srcdoc';
import { SANDBOX_RUNTIME_PATH as HTML_RUNTIME_PATH } from '../tags/html/sandbox/sandbox-srcdoc';
import { SANDBOX_RUNTIME_PATH as CUSTOM_MAP_RUNTIME_PATH } from '../tags/custom_map/sandbox/sandbox-srcdoc';

/**
 * The manifest is what every host app builds. A sandboxed component missing
 * from it doesn't fail anything at build time — it ships an iframe pointing at
 * a URL nobody emits, and the block renders blank in production. These tests
 * are the tripwire for that.
 */
describe('sandbox runtime manifest', () => {
	// Keys only — importing the modules would pull in echarts.
	const runtimeEntries = Object.keys(import.meta.glob('../tags/*/sandbox/runtime-entry.ts'));

	it('covers every sandboxed component on disk', () => {
		expect(runtimeEntries.length).toBeGreaterThan(0);

		const missing = runtimeEntries.filter((file) => {
			const tag = file.split('/tags/')[1]?.split('/')[0];
			return !SANDBOX_RUNTIMES.some((runtime) => runtime.entry.includes(`/tags/${tag}/`));
		});

		expect(
			missing,
			'add these to SANDBOX_RUNTIMES in core/src/user-components/sandbox/sandbox-runtimes.js, ' +
				'otherwise no host app builds their runtime and the block renders blank'
		).toEqual([]);
	});

	it('has no manifest entry without a runtime on disk', () => {
		const orphans = SANDBOX_RUNTIMES.filter(
			(runtime) => !runtimeEntries.some((file) => runtime.entry.endsWith(file.replace('../', '')))
		);
		expect(orphans).toEqual([]);
	});

	it('emits the files the components actually request', () => {
		const built = SANDBOX_RUNTIMES.map((runtime) => `${SANDBOX_SERVE_DIR}/${runtime.fileName}`);
		expect(built).toContain(HTML_RUNTIME_PATH);
		expect(built).toContain(ECHART_RUNTIME_PATH);
		expect(built).toContain(CUSTOM_MAP_RUNTIME_PATH);
	});

	it('does not emit two runtimes to the same filename', () => {
		const fileNames = SANDBOX_RUNTIMES.map((runtime) => runtime.fileName);
		expect(new Set(fileNames).size).toBe(fileNames.length);
	});
});
