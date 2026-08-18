import { describe, it, expect } from 'vitest';
import { groupIntoLines, widthChildShouldGrow, type ChildLayout } from './row-grouping';

describe('groupIntoLines', () => {
	it('returns no lines for no children', () => {
		expect(groupIntoLines([])).toEqual([]);
	});

	it('keeps left-to-right adjacent children (with a gap) on one line', () => {
		// [0,100] gap [120,220] gap [240,340] — each starts after the previous right edge
		const rects = [
			{ left: 0, right: 100 },
			{ left: 120, right: 220 },
			{ left: 240, right: 340 }
		];
		expect(groupIntoLines(rects)).toEqual([[0, 1, 2]]);
	});

	it('keeps flush gap-0 children (touching edges) on one line', () => {
		const rects = [
			{ left: 0, right: 100 },
			{ left: 100, right: 200 },
			{ left: 200, right: 300 }
		];
		expect(groupIntoLines(rects)).toEqual([[0, 1, 2]]);
	});

	it('starts a new line when a child wraps back to the container left', () => {
		const rects = [
			{ left: 0, right: 200 },
			{ left: 220, right: 400 },
			// wrapped row: left resets before the previous right edge
			{ left: 0, right: 200 },
			{ left: 220, right: 400 }
		];
		expect(groupIntoLines(rects)).toEqual([
			[0, 1],
			[2, 3]
		]);
	});

	it('groups mixed-height items on the same line regardless of vertical alignment', () => {
		// align=bottom makes tops differ; grouping is by horizontal edges only, so
		// these stay on one line (the bug the edge-based detection fixes).
		const rects = [
			{ left: 0, right: 150 },
			{ left: 150, right: 300 }
		];
		expect(groupIntoLines(rects)).toEqual([[0, 1]]);
	});

	it('absorbs sub-pixel rounding within the 0.5px tolerance', () => {
		// next.left is 0.4px short of prev.right — still the same line
		const rects = [
			{ left: 0, right: 100 },
			{ left: 99.6, right: 199.6 }
		];
		expect(groupIntoLines(rects)).toEqual([[0, 1]]);
	});

	it('wraps when the gap exceeds the tolerance in the negative direction', () => {
		// next.left is 1px short of prev.right − 0.5 → a real wrap, new line
		const rects = [
			{ left: 0, right: 100 },
			{ left: 98.5, right: 198.5 }
		];
		expect(groupIntoLines(rects)).toEqual([[0], [1]]);
	});
});

describe('widthChildShouldGrow', () => {
	const wrapperWithWidth: ChildLayout = { isWrapper: true, hasWidth: true };
	const wrapperNoWidth: ChildLayout = { isWrapper: true, hasWidth: false };
	const bareElement: ChildLayout = { isWrapper: false, hasWidth: false };

	it('does not adjust a child without a width', () => {
		expect(widthChildShouldGrow(wrapperNoWidth, [wrapperWithWidth])).toBe(false);
	});

	it('grows when every other component on the line also has a width (control)', () => {
		expect(widthChildShouldGrow(wrapperWithWidth, [wrapperWithWidth])).toBe(true);
	});

	it('grows when the only other line member is a bare element (the regression fix)', () => {
		// A width-set component sharing a line with prose should still fill the row,
		// matching pre-flush behavior.
		expect(widthChildShouldGrow(wrapperWithWidth, [bareElement])).toBe(true);
	});

	it('does not grow when another component on the line lacks a width', () => {
		// That width-less component should absorb the slack instead.
		expect(widthChildShouldGrow(wrapperWithWidth, [wrapperNoWidth])).toBe(false);
	});

	it('ignores bare elements even when a width-less component is also present', () => {
		expect(widthChildShouldGrow(wrapperWithWidth, [bareElement, wrapperNoWidth])).toBe(false);
		expect(widthChildShouldGrow(wrapperWithWidth, [bareElement, wrapperWithWidth])).toBe(true);
	});
});
