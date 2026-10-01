export type FileIconKind =
	| 'document'
	| 'spreadsheet'
	| 'presentation'
	| 'image'
	| 'archive'
	| 'code'
	| 'generic';

type KnownFileType = { label: string; icon: FileIconKind };

// Display-only; unknown extensions still render with an upper-cased label and a generic icon.
const KNOWN_FILE_TYPES: Record<string, KnownFileType> = {
	pdf: { label: 'PDF', icon: 'document' },
	doc: { label: 'Word', icon: 'document' },
	docx: { label: 'Word', icon: 'document' },
	txt: { label: 'Text', icon: 'document' },
	md: { label: 'Markdown', icon: 'document' },
	xls: { label: 'Excel', icon: 'spreadsheet' },
	xlsx: { label: 'Excel', icon: 'spreadsheet' },
	csv: { label: 'CSV', icon: 'spreadsheet' },
	tsv: { label: 'TSV', icon: 'spreadsheet' },
	parquet: { label: 'Parquet', icon: 'spreadsheet' },
	ppt: { label: 'PowerPoint', icon: 'presentation' },
	pptx: { label: 'PowerPoint', icon: 'presentation' },
	png: { label: 'PNG', icon: 'image' },
	jpg: { label: 'JPEG', icon: 'image' },
	jpeg: { label: 'JPEG', icon: 'image' },
	gif: { label: 'GIF', icon: 'image' },
	webp: { label: 'WebP', icon: 'image' },
	zip: { label: 'ZIP', icon: 'archive' },
	json: { label: 'JSON', icon: 'code' },
	sql: { label: 'SQL', icon: 'code' },
	yaml: { label: 'YAML', icon: 'code' },
	yml: { label: 'YAML', icon: 'code' }
};

/** Alias prefix returned by Studio's upload endpoint: `evd_<orgId>/<file>.<ext>`. */
export const FILE_ALIAS_PREFIX = 'evd_';

/** Authenticated Studio proxy that serves private uploaded files. */
export const FILE_PROXY_PATH = '/upload-file/';

/** Lowercase extension of a filename or URL path, without the dot. Empty when none. */
export function fileExtension(nameOrUrl: string | undefined): string {
	if (!nameOrUrl) return '';
	let path = nameOrUrl;
	try {
		if (path.includes('://')) path = new URL(path).pathname;
	} catch {
		// Not an absolute URL; treat the whole string as a path.
	}
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	const base = path.split('/').pop() ?? '';
	const dot = base.lastIndexOf('.');
	if (dot <= 0 || dot === base.length - 1) return '';
	return base.slice(dot + 1).toLowerCase();
}

/** Last path segment of a URL or path, URL-decoded; the fallback display name. */
export function fileNameFromUrl(url: string | undefined): string {
	if (!url) return '';
	let path = url.startsWith(FILE_ALIAS_PREFIX) ? url.slice(FILE_ALIAS_PREFIX.length) : url;
	try {
		if (path.includes('://')) path = new URL(path).pathname;
	} catch {
		// Not an absolute URL.
	}
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const base = path.split('/').filter(Boolean).pop() ?? '';
	try {
		return decodeURIComponent(base);
	} catch {
		return base;
	}
}

/** Explicit `type`, else from the extension of `name` then `url`; unknown extensions upper-cased, not hidden. */
export function inferFileTypeLabel(opts: {
	type?: string;
	name?: string;
	url?: string;
}): string | undefined {
	if (opts.type) return opts.type;
	const ext = fileExtension(opts.name) || fileExtension(opts.url);
	if (!ext) return undefined;
	return KNOWN_FILE_TYPES[ext]?.label ?? ext.toUpperCase();
}

/** Which icon family to draw for a file, from its name/url extension. */
export function inferFileIconKind(opts: { name?: string; url?: string }): FileIconKind {
	const ext = fileExtension(opts.name) || fileExtension(opts.url);
	return (ext && KNOWN_FILE_TYPES[ext]?.icon) || 'generic';
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});

/** "Sep 29, 2026" from `YYYY-MM-DD` (no timezone shift) or ISO; free text like "Q3 2026" passes through. */
export function formatFileDate(date: string | undefined): string | undefined {
	if (!date) return undefined;
	const trimmed = date.trim();
	if (!trimmed) return undefined;

	const dateOnly = DATE_ONLY.exec(trimmed);
	if (dateOnly) {
		const [y, m, d] = dateOnly.slice(1).map(Number);
		const parsed = new Date(Date.UTC(y, m - 1, d));
		// Date.UTC silently rolls "2026-02-30" into March; show such input as written instead.
		const isRealDate =
			parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
		if (!isRealDate) return trimmed;
		return dateFormatter.format(parsed);
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) return trimmed;
	return dateFormatter.format(parsed);
}

/** `evd_` alias → authenticated proxy path (with `?name=` for the download filename); other URLs unchanged. */
export function expandFileUrl(url: string | undefined, name?: string): string | undefined {
	if (!url) return url;
	if (!url.startsWith(FILE_ALIAS_PREFIX)) return url;
	const key = url.slice(FILE_ALIAS_PREFIX.length);
	const query = name ? `?name=${encodeURIComponent(name)}` : '';
	return `${FILE_PROXY_PATH}${key}${query}`;
}

/** True when the url is a Studio upload alias rather than an external link. */
export function isFileAlias(url: string | undefined): boolean {
	return Boolean(url?.startsWith(FILE_ALIAS_PREFIX));
}
