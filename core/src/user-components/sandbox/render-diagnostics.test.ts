// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
	classifySurface,
	describeCollapsedAncestors,
	validateDiagnosticsMessage
} from './render-diagnostics';

describe('validateDiagnosticsMessage', () => {
	it('keeps primitive metrics and clamps long strings and non-finite numbers', () => {
		const result = validateDiagnosticsMessage({
			type: 'diag',
			phase: 'settled',
			metrics: { width: 640, ratio: Infinity, visible: true, note: null, label: 'x'.repeat(500) }
		});
		expect(result?.metrics).toEqual({
			width: 640,
			ratio: null,
			visible: true,
			note: null,
			label: 'x'.repeat(300)
		});
	});

	it.each([
		['unknown phase', { type: 'diag', phase: 'timeout', metrics: {} }],
		['nested metric', { type: 'diag', phase: 'rendered', metrics: { size: { w: 1 } } }],
		['array metrics', { type: 'diag', phase: 'rendered', metrics: [1, 2] }],
		[
			'too many metrics',
			{
				type: 'diag',
				phase: 'rendered',
				metrics: Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`m${i}`, i]))
			}
		]
	])('rejects %s', (_label, message) => {
		expect(validateDiagnosticsMessage(message)).toBeNull();
	});
});

describe('classifySurface', () => {
	const healthy = {
		boxWidth: 500,
		boxHeight: 400,
		drawnWidth: 500,
		drawnHeight: 400,
		painted: 120
	};

	it('treats a chart filling its box with pixels as healthy', () => {
		expect(classifySurface(healthy)).toBe('');
		expect(classifySurface({ ...healthy, drawnWidth: 498, painted: null })).toBe('');
	});

	it('flags a chart drawn at zero size inside a sized box (the resize-fixes-it case)', () => {
		expect(classifySurface({ ...healthy, drawnWidth: 0, drawnHeight: 0 })).toBe('drawn-zero');
	});

	it('flags a chart drawn at a stale size', () => {
		expect(classifySurface({ ...healthy, drawnWidth: 300 })).toBe('size-mismatch');
	});

	it('flags a zero-sized box before checking the drawing', () => {
		expect(classifySurface({ ...healthy, boxHeight: 0, drawnHeight: 0 })).toBe('box-zero');
	});

	it('flags a correctly sized canvas with no painted pixels', () => {
		expect(classifySurface({ ...healthy, painted: 0 })).toBe('nothing-painted');
	});
});

describe('describeCollapsedAncestors', () => {
	const sized = (el: Element, width: number, height: number) => {
		el.getBoundingClientRect = () => ({ width, height }) as DOMRect;
	};

	it('walks up from the frame to the first ancestor with a real size', () => {
		document.body.innerHTML = `
			<div id="page" class="prose">
				<div class="ignored"></div>
				<div class="outer">
					<div class="wrapper a b c d e" data-render="custom_echart" data-component-title="MRR" style="display: none">
						<div class="relative w-full"><iframe></iframe></div>
					</div>
				</div>
			</div>`;
		const q = (selector: string) => document.querySelector(selector)!;
		sized(q('#page'), 900, 2000);
		sized(q('.outer'), 742, 0);
		sized(q('.wrapper'), 0, 0);
		sized(q('.relative'), 0, 0);

		expect(describeCollapsedAncestors(q('iframe'))).toBe(
			'div.relative.w-full 0x0 block < ' +
				'div.wrapper.a.b.c [custom_echart "MRR"] 0x0 none < ' +
				'div.outer 742x0 block < ' +
				'div.prose 900x2000 block'
		);
	});
});
