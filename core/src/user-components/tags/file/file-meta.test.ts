import { describe, it, expect } from 'vitest';
import {
	expandFileUrl,
	fileExtension,
	fileNameFromUrl,
	formatFileDate,
	inferFileIconKind,
	inferFileTypeLabel,
	isFileAlias
} from './file-meta';

describe('fileExtension', () => {
	it('reads the extension from a plain filename', () => {
		expect(fileExtension('Q3 Board Deck.PDF')).toBe('pdf');
	});

	it('ignores query strings and fragments on URLs', () => {
		expect(fileExtension('https://files.example.com/a/b/report.xlsx?sig=abc#x')).toBe('xlsx');
	});

	it('reads the extension from an evd_ alias', () => {
		expect(fileExtension('evd_org_1/k7Xq2mB9.docx')).toBe('docx');
	});
});

describe('fileNameFromUrl', () => {
	it('returns the decoded last path segment of a URL', () => {
		expect(fileNameFromUrl('https://x.com/dir/My%20Report.pdf?token=1')).toBe('My Report.pdf');
	});

	it('strips the evd_ prefix and org from an alias', () => {
		expect(fileNameFromUrl('evd_org_1/k7Xq2mB9.pdf')).toBe('k7Xq2mB9.pdf');
	});

	it('drops URL fragments, including ones that contain a question mark', () => {
		expect(fileNameFromUrl('https://x.com/report.pdf#download')).toBe('report.pdf');
		expect(fileNameFromUrl('https://x.com/report.pdf#page=2?zoom=100')).toBe('report.pdf');
		expect(fileNameFromUrl('/docs/report.pdf?v=2#top')).toBe('report.pdf');
	});
});

describe('inferFileTypeLabel', () => {
	it('maps known extensions to friendly labels', () => {
		expect(inferFileTypeLabel({ name: 'model.xlsx' })).toBe('Excel');
		expect(inferFileTypeLabel({ name: 'deck.pptx' })).toBe('PowerPoint');
		expect(inferFileTypeLabel({ url: 'evd_org_1/abc.csv' })).toBe('CSV');
	});

	it('falls back from name to url when the name has no extension', () => {
		expect(inferFileTypeLabel({ name: 'Customer Export', url: 'evd_org_1/abc.parquet' })).toBe(
			'Parquet'
		);
	});

	it('upper-cases unknown extensions rather than hiding them', () => {
		expect(inferFileTypeLabel({ name: 'survey.sav' })).toBe('SAV');
	});
});

describe('inferFileIconKind', () => {
	it('picks the icon family from the extension', () => {
		expect(inferFileIconKind({ name: 'a.pdf' })).toBe('document');
		expect(inferFileIconKind({ name: 'a.csv' })).toBe('spreadsheet');
		expect(inferFileIconKind({ name: 'a.zip' })).toBe('archive');
		expect(inferFileIconKind({ name: 'a.sql' })).toBe('code');
		expect(inferFileIconKind({ name: 'a.png' })).toBe('image');
	});

	it('is generic when nothing matches', () => {
		expect(inferFileIconKind({ name: 'blob.sav' })).toBe('generic');
	});
});

describe('formatFileDate', () => {
	it('formats a calendar date without a timezone shift', () => {
		expect(formatFileDate('2026-09-29')).toBe('Sep 29, 2026');
		expect(formatFileDate('2026-01-01')).toBe('Jan 1, 2026');
	});

	it('formats an ISO timestamp as its UTC calendar date', () => {
		expect(formatFileDate('2026-09-29T23:30:00Z')).toBe('Sep 29, 2026');
	});

	it('passes free text through unchanged', () => {
		expect(formatFileDate('Q3 2026')).toBe('Q3 2026');
	});

	it('shows impossible calendar dates as written instead of rolling them over', () => {
		expect(formatFileDate('2026-02-30')).toBe('2026-02-30');
		expect(formatFileDate('2026-13-01')).toBe('2026-13-01');
		expect(formatFileDate('2026-04-31')).toBe('2026-04-31');
		expect(formatFileDate('2024-02-29')).toBe('Feb 29, 2024');
	});
});

describe('expandFileUrl', () => {
	it('maps an evd_ alias to the authenticated proxy with the display name', () => {
		expect(expandFileUrl('evd_org_1/k7Xq2mB9.pdf', 'Q3 Deck.pdf')).toBe(
			'/upload-file/org_1/k7Xq2mB9.pdf?name=Q3%20Deck.pdf'
		);
	});

	it('leaves external URLs untouched', () => {
		expect(expandFileUrl('https://example.com/a.pdf', 'a.pdf')).toBe('https://example.com/a.pdf');
	});

	it('identifies aliases', () => {
		expect(isFileAlias('evd_org_1/a.pdf')).toBe(true);
		expect(isFileAlias('https://example.com/a.pdf')).toBe(false);
		expect(isFileAlias(undefined)).toBe(false);
	});
});
