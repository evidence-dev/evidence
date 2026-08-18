import { describe, it, expect } from 'vitest';
import { validateDeprecatedFrontmatterKeys } from './validateDeprecatedFrontmatter';
import type { ValidationContext } from './types';

// The validator only reads `useRelativeResolution`; the rest of the context is irrelevant.
const newStructure = { useRelativeResolution: true } as unknown as ValidationContext;
const legacy = { useRelativeResolution: false } as unknown as ValidationContext;

describe('validateDeprecatedFrontmatterKeys', () => {
	it('returns [] for legacy projects (gate off) regardless of frontmatter', () => {
		expect(validateDeprecatedFrontmatterKeys('assetId: x\nname: y\ntype: page', legacy)).toEqual([]);
		expect(validateDeprecatedFrontmatterKeys('assetId: x', undefined)).toEqual([]);
	});

	it('returns [] when there is no frontmatter', () => {
		expect(validateDeprecatedFrontmatterKeys(undefined, newStructure)).toEqual([]);
		expect(validateDeprecatedFrontmatterKeys('', newStructure)).toEqual([]);
	});

	it('warns on assetId with the exact message, level and line', () => {
		// frontmatter-string line 0 → editor line 1 (the opening `---` is line 0)
		const errors = validateDeprecatedFrontmatterKeys(
			'assetId: 11111111-1111-4111-8111-111111111111',
			newStructure
		);
		expect(errors).toHaveLength(1);
		expect(errors[0].error.id).toBe('frontmatter-deprecated-assetId');
		expect(errors[0].error.level).toBe('warning');
		expect(errors[0].error.message).toBe('asset ID is deprecated, you can remove this from the page');
		expect(errors[0].lines).toEqual([1, 1]);
		expect(errors[0].location?.start.line).toBe(1);
	});

	it('warns on `name` (optional, replace with title)', () => {
		const errors = validateDeprecatedFrontmatterKeys('name: Home', newStructure);
		expect(errors).toHaveLength(1);
		expect(errors[0].error.id).toBe('frontmatter-deprecated-name');
		expect(errors[0].error.message).toBe('name is optional and can be removed; use title instead');
	});

	it('warns on `type: page` but NOT on `type: partial`', () => {
		const page = validateDeprecatedFrontmatterKeys('title: Home\ntype: page', newStructure);
		expect(page).toHaveLength(1);
		expect(page[0].error.id).toBe('frontmatter-deprecated-type');
		expect(page[0].lines).toEqual([2, 2]); // second frontmatter line → editor line 2

		expect(validateDeprecatedFrontmatterKeys('title: Footer\ntype: partial', newStructure)).toEqual(
			[]
		);
	});

	it('does not flag indented (nested) keys, e.g. a `name:` under a theme block', () => {
		expect(
			validateDeprecatedFrontmatterKeys('title: Home\ntheme:\n  name: dark', newStructure)
		).toEqual([]);
	});

	it('emits one warning per deprecated key on its own line', () => {
		const errors = validateDeprecatedFrontmatterKeys(
			'title: Home\nassetId: 11111111-1111-4111-8111-111111111111\nname: Old\ntype: page',
			newStructure
		);
		const byLine = errors.map((e) => [e.error.id, e.lines[0]]);
		expect(byLine).toEqual([
			['frontmatter-deprecated-assetId', 2],
			['frontmatter-deprecated-name', 3],
			['frontmatter-deprecated-type', 4]
		]);
	});

	it('does not warn on `title`', () => {
		expect(validateDeprecatedFrontmatterKeys('title: Home', newStructure)).toEqual([]);
	});
});
