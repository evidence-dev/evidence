/**
 * Pure layout decisions for the `row` component, extracted so they can be unit
 * tested without a DOM (the live logic in Row.svelte reads geometry from
 * getBoundingClientRect, which jsdom can't compute).
 */

/** Horizontal extent of a child, in client coordinates. */
export interface ChildRect {
	left: number;
	right: number;
}

/** What the flex-grow decision needs to know about a child. */
export interface ChildLayout {
	/** Is this a component (`.component-wrapper`) rather than a bare element? */
	isWrapper: boolean;
	/** Does this child carry an explicit `width`? */
	hasWidth: boolean;
}

/**
 * Group children into visual lines by left-to-right edge adjacency, returning
 * child indices per line in DOM order.
 *
 * A child joins the current line when its left edge is at or after the previous
 * child's right edge (items lay out left-to-right and don't overlap; with gap-0
 * flush rows adjacent edges are exactly equal). A flex-wrap resets the next
 * child to the container's left, which is before that right edge, starting a
 * new line. Comparing the right edge — not just lefts — is alignment
 * independent (align=bottom rows have differing tops). The 0.5px tolerance
 * absorbs sub-pixel rounding from getBoundingClientRect.
 */
export const groupIntoLines = (rects: ChildRect[]): number[][] => {
	const lines: number[][] = [];
	let lastRight: number | null = null;
	rects.forEach((rect, index) => {
		if (lastRight === null || rect.left >= lastRight - 0.5) {
			if (lines.length === 0) lines.push([]);
			lines[lines.length - 1]!.push(index);
		} else {
			lines.push([index]);
		}
		lastRight = rect.right;
	});
	return lines;
};

/**
 * A width-set component fills the slack left after a flex-wrap only when no
 * *other component* on its line is itself width-less — that width-less
 * component is the one that should absorb the slack instead.
 *
 * Non-component children (bare markdown elements such as paragraphs, headings,
 * or images) are ignored. They never participated in this decision until the
 * flush work widened the child selector to `:scope > *`; counting them would
 * silently stop a width-set component from growing whenever it happened to
 * share a line with prose.
 */
export const widthChildShouldGrow = (
	child: ChildLayout,
	otherChildrenOnLine: ChildLayout[]
): boolean => {
	if (!child.hasWidth) return false;
	return !otherChildrenOnLine.some((other) => other.isWrapper && !other.hasWidth);
};
