import { describe, it, expect } from 'vitest';
import { validateInvalidIconName } from './validateInvalidIconName';
import { availableIconNames } from '../common/icon-names';
import type { ValidationContext } from './types';

// The validator only reads `useRelativeResolution`; the rest is irrelevant.
const newStructure = { useRelativeResolution: true } as unknown as ValidationContext;
const legacy = { useRelativeResolution: false } as unknown as ValidationContext;

const validIcon = availableIconNames[0]; // a known-good name from the canonical list

describe('validateInvalidIconName', () => {
	it('returns [] for legacy projects (gate off)', () => {
		expect(validateInvalidIconName('icon: not-a-real-icon', legacy)).toEqual([]);
		expect(validateInvalidIconName('icon: not-a-real-icon', undefined)).toEqual([]);
	});

	it('returns [] when there is no frontmatter', () => {
		expect(validateInvalidIconName(undefined, newStructure)).toEqual([]);
		expect(validateInvalidIconName('', newStructure)).toEqual([]);
	});

	it('does not warn on a valid icon name', () => {
		expect(validateInvalidIconName(`icon: ${validIcon}`, newStructure)).toEqual([]);
	});

	it('does not warn on a valid name with different case / underscores', () => {
		const upperUnderscored = validIcon.toUpperCase().replace(/-/g, '_');
		expect(validateInvalidIconName(`icon: ${upperUnderscored}`, newStructure)).toEqual([]);
	});

	it('warns on an unknown icon name with the right id, level and line', () => {
		// frontmatter-string line 0 → editor line 1 (the opening `---` is line 0)
		const errors = validateInvalidIconName('icon: definitely-not-an-icon', newStructure);
		expect(errors).toHaveLength(1);
		expect(errors[0].error.id).toBe('frontmatter-invalid-icon');
		expect(errors[0].error.level).toBe('warning');
		expect(errors[0].error.message).toContain('definitely-not-an-icon');
		expect(errors[0].lines).toEqual([1, 1]);
		expect(errors[0].location?.start.line).toBe(1);
	});

	it('reports the correct editor line for a non-first frontmatter key', () => {
		const errors = validateInvalidIconName('title: Home\nicon: bogus-icon', newStructure);
		expect(errors).toHaveLength(1);
		expect(errors[0].lines).toEqual([2, 2]);
	});

	it('handles quoted values', () => {
		expect(validateInvalidIconName(`icon: "${validIcon}"`, newStructure)).toEqual([]);
		expect(validateInvalidIconName(`icon: 'bogus-icon'`, newStructure)).toHaveLength(1);
	});

	it('does not warn on an empty / null icon (means "no icon")', () => {
		expect(validateInvalidIconName('icon:', newStructure)).toEqual([]);
		expect(validateInvalidIconName('icon: null', newStructure)).toEqual([]);
		expect(validateInvalidIconName('icon: ~', newStructure)).toEqual([]);
	});

	it('does not flag an indented (nested) icon key', () => {
		expect(validateInvalidIconName('theme:\n  icon: bogus-icon', newStructure)).toEqual([]);
	});
});
