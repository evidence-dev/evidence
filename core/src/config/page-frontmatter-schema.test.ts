import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { isPageDownloadEnabled, projectRootPageFrontmatterSchema } from './page-frontmatter-schema';

const downIsGood = (frontmatter: string) =>
	projectRootPageFrontmatterSchema.parse(yaml.load(frontmatter)).down_is_good;

describe('down_is_good frontmatter', () => {
	it.each([
		['down_is_good: true', true],
		['down_is_good: false', false],
		['down_is_good: "false"', false],
		["down_is_good: 'true'", true],
		['down_is_good: "TRUE"', true],
		['down_is_good: yes', undefined],
		['down_is_good: 1', undefined],
		['title: Costs', undefined]
	])('%s → %s', (frontmatter, expected) => {
		expect(downIsGood(frontmatter)).toBe(expected);
	});
});

const parseDownloads = (downloads: unknown) =>
	projectRootPageFrontmatterSchema.parse({ downloads }).downloads;

describe('isPageDownloadEnabled', () => {
	it('enables every kind when downloads is unset', () => {
		expect(isPageDownloadEnabled(undefined, 'pdf')).toBe(true);
		expect(isPageDownloadEnabled(null, 'data')).toBe(true);
	});

	it('`downloads: false` disables every kind', () => {
		const downloads = parseDownloads(false);
		expect(isPageDownloadEnabled(downloads, 'pdf')).toBe(false);
		expect(isPageDownloadEnabled(downloads, 'data')).toBe(false);
		expect(isPageDownloadEnabled(downloads, 'image')).toBe(false);
	});

	it('the object form disables only the listed kinds', () => {
		const downloads = parseDownloads({ pdf: false });
		expect(isPageDownloadEnabled(downloads, 'pdf')).toBe(false);
		expect(isPageDownloadEnabled(downloads, 'data')).toBe(true);
		expect(isPageDownloadEnabled(downloads, 'image')).toBe(true);
	});

	it('`excel: false` hides only the Excel report', () => {
		const downloads = parseDownloads({ excel: false });
		expect(isPageDownloadEnabled(downloads, 'excel')).toBe(false);
		expect(isPageDownloadEnabled(downloads, 'data')).toBe(true);
		expect(isPageDownloadEnabled(downloads, 'image')).toBe(true);
	});

	it('hides the Excel report when image or data is off, since it contains both', () => {
		expect(isPageDownloadEnabled(parseDownloads({ image: false }), 'excel')).toBe(false);
		expect(isPageDownloadEnabled(parseDownloads({ data: false }), 'excel')).toBe(false);
		expect(isPageDownloadEnabled(parseDownloads({ image: false, excel: true }), 'excel')).toBe(
			false
		);
		expect(isPageDownloadEnabled(parseDownloads({ pdf: false }), 'excel')).toBe(true);
		expect(isPageDownloadEnabled(parseDownloads(false), 'excel')).toBe(false);
		expect(isPageDownloadEnabled(undefined, 'excel')).toBe(true);
	});

	it('ignores a malformed per-kind value instead of the whole object', () => {
		const downloads = parseDownloads({ pdf: false, data: 'no' });
		expect(isPageDownloadEnabled(downloads, 'pdf')).toBe(false);
		expect(isPageDownloadEnabled(downloads, 'data')).toBe(true);
	});

	it('leaves downloads on for an unparseable value', () => {
		expect(isPageDownloadEnabled(parseDownloads('nope'), 'pdf')).toBe(true);
	});
});
