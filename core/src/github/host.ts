export const GITHUB_DOT_COM_HOST = 'github.com';

export type GithubProvider = 'github_com' | 'ghe_cloud';

const GHE_CLOUD_HOST_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ghe\.com$/;

export function normalizeGithubHost(value: string | null | undefined): string {
	const raw = value?.trim().toLowerCase();
	if (!raw) return GITHUB_DOT_COM_HOST;

	let url: URL;
	try {
		url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
	} catch {
		throw new Error('Enter a valid GitHub hostname');
	}

	if (
		url.protocol !== 'https:' ||
		url.username ||
		url.password ||
		url.port ||
		(url.pathname !== '' && url.pathname !== '/') ||
		url.search ||
		url.hash
	) {
		throw new Error('GitHub hostname must not include a path, port, query, or credentials');
	}

	const host = url.hostname.toLowerCase();
	if (host !== GITHUB_DOT_COM_HOST && !GHE_CLOUD_HOST_RE.test(host)) {
		throw new Error('Only github.com and GitHub Enterprise Cloud (*.ghe.com) are supported');
	}
	return host;
}

export function getGithubProvider(host: string | null | undefined): GithubProvider {
	return normalizeGithubHost(host) === GITHUB_DOT_COM_HOST ? 'github_com' : 'ghe_cloud';
}

export function isGithubEnterpriseCloudHost(host: string | null | undefined): boolean {
	try {
		return getGithubProvider(host) === 'ghe_cloud';
	} catch {
		return false;
	}
}

export function getGithubWebBaseUrl(host: string | null | undefined): string {
	return `https://${normalizeGithubHost(host)}`;
}

export function getGithubApiBaseUrl(host: string | null | undefined): string {
	const normalized = normalizeGithubHost(host);
	return normalized === GITHUB_DOT_COM_HOST
		? 'https://api.github.com'
		: `https://api.${normalized}`;
}

export function buildGithubWebUrl(
	host: string | null | undefined,
	...segments: Array<string | number>
): string {
	const encodedPath = segments.map((segment) => encodeURIComponent(String(segment))).join('/');
	return `${getGithubWebBaseUrl(host)}/${encodedPath}`;
}
