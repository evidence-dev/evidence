import { describe, it, expect } from 'vitest';
import { markdownFileKind } from './markdown-file-kind';

describe('markdownFileKind', () => {
	it('takes the kind from a reserved top-level folder when nothing is declared', () => {
		expect(markdownFileKind('components/kpi_card.md', undefined)).toBe('component');
		expect(markdownFileKind('components/kpi_card', undefined)).toBe('component');
		expect(markdownFileKind('partials/footer.md', undefined)).toBe('partial');
		expect(markdownFileKind('components/charts/bar.md', undefined)).toBe('component');
	});

	it('lets an explicit declaration override the folder', () => {
		expect(markdownFileKind('components/notes.md', 'page')).toBe('page');
		expect(markdownFileKind('components/footer.md', 'partial')).toBe('partial');
		expect(markdownFileKind('partials/widget.md', 'component')).toBe('component');
	});

	it('honours a declaration outside any reserved folder (colocation)', () => {
		expect(markdownFileKind('pages/kpi_card.md', 'component')).toBe('component');
		expect(markdownFileKind('pages/footer.md', 'partial')).toBe('partial');
	});

	it('defaults to page', () => {
		expect(markdownFileKind('pages/home.md', undefined)).toBe('page');
		expect(markdownFileKind('pages/home.md', 'page')).toBe('page');
		// A nested folder that happens to share a reserved name is the user's own.
		expect(markdownFileKind('pages/components/thing.md', undefined)).toBe('page');
		// Root-level file with no folder at all.
		expect(markdownFileKind('components.md', undefined)).toBe('page');
	});

	it('treats an unrecognised declaration as a page', () => {
		expect(markdownFileKind('components/thing.md', 'yaml')).toBe('page');
	});
});
