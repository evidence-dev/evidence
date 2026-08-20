import { describe, it, expect } from 'vitest';
import { frontmatterDisplayName } from './frontmatterName';

describe('frontmatterDisplayName', () => {
	it('prefers the frontmatter title', () => {
		const content = `---\ntitle: Quarterly Report\nname: legacy_name\n---\n\n# Body`;
		expect(frontmatterDisplayName(content)).toBe('Quarterly Report');
	});

	it('falls back to the deprecated name when no title', () => {
		const content = `---\nname: My Legacy Name\n---\n\nbody`;
		expect(frontmatterDisplayName(content)).toBe('My Legacy Name');
	});

	it('returns undefined when neither title nor name is present', () => {
		// Caller falls back to the filename.
		const content = `---\nsidebar_position: 2\n---\n\nbody`;
		expect(frontmatterDisplayName(content)).toBeUndefined();
	});

	it('returns undefined when there is no frontmatter at all', () => {
		expect(frontmatterDisplayName('# Just a heading\n\nsome text')).toBeUndefined();
	});

	it('ignores whitespace-only title/name (treats as absent)', () => {
		expect(frontmatterDisplayName(`---\ntitle: "   "\n---\nbody`)).toBeUndefined();
	});

	it('does not throw on malformed YAML frontmatter', () => {
		// parseFrontmatter swallows YAML errors and returns {}, so we get undefined.
		expect(frontmatterDisplayName(`---\ntitle: [unclosed\n---\nbody`)).toBeUndefined();
	});
});
