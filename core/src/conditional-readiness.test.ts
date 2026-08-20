import { describe, it, expect } from 'vitest';

/**
 * Tests for the conditional resolution logic used in Conditional.svelte.
 *
 * The `isResolved()` function determines whether the conditional system has
 * made its decision about which branch to render. This is critical for PDF
 * readiness — the Else block uses `isResolved()` as its `isSelfReady` condition
 * in `setupContainerReadiness('else', () => ctx.isResolved())`.
 *
 * If `isResolved()` returns `true` too early, the Else container completes
 * before its children mount, causing PDFs with loading spinners.
 *
 * The actual logic from Conditional.svelte:
 *   function isResolved(): boolean {
 *     for (const cond of conditions) {
 *       const result = cond.condition?.();
 *       if (result === undefined) return false; // Still loading
 *       if (result === true) return true; // A condition matched
 *     }
 *     return true; // All false → Else renders
 *   }
 *
 *   function shouldRender(id: string): boolean {
 *     for (const cond of conditions) {
 *       const result = cond.condition?.();
 *       if (result === undefined) return false;
 *       if (result === true) return cond.id === id;
 *     }
 *     return false;
 *   }
 */

type Condition = {
	id: string;
	tag: string;
	condition?: () => boolean | undefined;
};

function isResolved(conditions: Condition[]): boolean {
	for (const cond of conditions) {
		const result = cond.condition?.();
		if (result === undefined) return false; // Still loading
		if (result === true) return true; // A condition matched — decision made
	}
	return true; // All conditions evaluated to false
}

function shouldRender(conditions: Condition[], id: string): boolean {
	for (const cond of conditions) {
		const result = cond.condition?.();
		if (result === undefined) return false;
		if (result === true) return cond.id === id;
	}
	return false;
}

describe('Conditional isResolved logic', () => {
	describe('single If + Else', () => {
		it('returns false when If condition is still loading', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => undefined },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(false);
		});

		it('returns true when If condition is true', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => true },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(true);
		});

		it('returns true when If condition is false (Else renders)', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(true);
		});

		it('shouldRender: If renders when condition true', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => true },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(shouldRender(conditions, 'if-1')).toBe(true);
			expect(shouldRender(conditions, 'else-2')).toBe(false);
		});

		it('shouldRender: Else renders when If is false', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(shouldRender(conditions, 'if-1')).toBe(false);
			expect(shouldRender(conditions, 'else-2')).toBe(true);
		});

		it('shouldRender: nothing renders when loading', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => undefined },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];
			expect(shouldRender(conditions, 'if-1')).toBe(false);
			expect(shouldRender(conditions, 'else-2')).toBe(false);
		});
	});

	describe('If + ElseIf + Else', () => {
		it('returns false when first condition is loading', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => undefined },
				{ id: 'elseif-2', tag: 'if', condition: () => true },
				{ id: 'else-3', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(false);
		});

		it('returns true when first condition is true (short-circuits)', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => true },
				{ id: 'elseif-2', tag: 'if', condition: () => undefined }, // Not even evaluated
				{ id: 'else-3', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(true);
		});

		it('returns false when first is false but second is loading', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false },
				{ id: 'elseif-2', tag: 'if', condition: () => undefined },
				{ id: 'else-3', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(false);
		});

		it('returns true when both are false (Else renders)', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false },
				{ id: 'elseif-2', tag: 'if', condition: () => false },
				{ id: 'else-3', tag: 'else', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(true);
		});

		it('shouldRender: ElseIf renders when If is false and ElseIf is true', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false },
				{ id: 'elseif-2', tag: 'if', condition: () => true },
				{ id: 'else-3', tag: 'else', condition: () => true }
			];
			expect(shouldRender(conditions, 'if-1')).toBe(false);
			expect(shouldRender(conditions, 'elseif-2')).toBe(true);
			expect(shouldRender(conditions, 'else-3')).toBe(false);
		});
	});

	describe('If without Else', () => {
		it('returns false when condition is loading', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => undefined }
			];
			expect(isResolved(conditions)).toBe(false);
		});

		it('returns true when condition is true', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => true }
			];
			expect(isResolved(conditions)).toBe(true);
		});

		it('returns true when condition is false (nothing renders)', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => false }
			];
			expect(isResolved(conditions)).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('returns true when no conditions registered', () => {
			expect(isResolved([])).toBe(true);
		});

		it('handles condition without function', () => {
			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: undefined }
			];
			// condition?.() returns undefined → still loading
			expect(isResolved(conditions)).toBe(false);
		});

		it('loading → resolved transition', () => {
			// Simulates a query that starts loading, then resolves
			let queryResult: boolean | undefined = undefined;

			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => queryResult },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];

			// Initially loading
			expect(isResolved(conditions)).toBe(false);
			expect(shouldRender(conditions, 'if-1')).toBe(false);
			expect(shouldRender(conditions, 'else-2')).toBe(false);

			// Query resolves to true → If renders
			queryResult = true;
			expect(isResolved(conditions)).toBe(true);
			expect(shouldRender(conditions, 'if-1')).toBe(true);
			expect(shouldRender(conditions, 'else-2')).toBe(false);
		});

		it('loading → resolved transition (false → Else renders)', () => {
			let queryResult: boolean | undefined = undefined;

			const conditions: Condition[] = [
				{ id: 'if-1', tag: 'if', condition: () => queryResult },
				{ id: 'else-2', tag: 'else', condition: () => true }
			];

			expect(isResolved(conditions)).toBe(false);

			queryResult = false;
			expect(isResolved(conditions)).toBe(true);
			expect(shouldRender(conditions, 'if-1')).toBe(false);
			expect(shouldRender(conditions, 'else-2')).toBe(true);
		});
	});
});
