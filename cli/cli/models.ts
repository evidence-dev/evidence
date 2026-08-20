/**
 * Models command — list models with status
 */

import { loadCredentials } from './storage.ts';
import { ensureAuthenticated } from './auth.ts';
import { renderCompactTable } from './table.ts';
import { printResult, resolveFormat, fail, type OutputOptions } from './output.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

interface ModelInfo {
	name: string;
	description: string;
	status: 'SUCCESS' | 'ERROR' | 'IN_PROGRESS';
	schedule: number;
	engine: string;
	lastRefresh: string | null;
	nextRefresh: string | null;
	error: string | null;
}

function formatRelativePast(isoDate: string): string {
	const diff = Date.now() - new Date(isoDate).getTime();
	if (diff < 0) return 'just now';
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}

function getStatusIcon(status: string): string {
	switch (status) {
		case 'SUCCESS':
			return '✓';
		case 'ERROR':
			return '✗';
		case 'IN_PROGRESS':
			return '◷';
		default:
			return '?';
	}
}

function getStatusLabel(status: string): string {
	switch (status) {
		case 'SUCCESS':
			return 'Up to date';
		case 'ERROR':
			return 'Error';
		case 'IN_PROGRESS':
			return 'Refreshing';
		default:
			return status;
	}
}

async function fetchModels(): Promise<ModelInfo[]> {
	const credentials = await loadCredentials();
	if (!credentials?.refreshToken && !credentials?.aptToken) {
		throw new Error('Not authenticated. Run `evidence login` first.');
	}
	if (!credentials.organizationId) {
		throw new Error('No organization selected. Run `evidence login` to authenticate.');
	}

	const response = await fetch(`${STUDIO_HOST}/api/cli/models`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			refreshToken: credentials.refreshToken,
			aptToken: credentials.aptToken,
			organizationId: credentials.organizationId
		})
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch models: ${response.status} ${text}`);
	}

	const data = (await response.json()) as { models: ModelInfo[] };
	return data.models;
}

function printTable(models: ModelInfo[]): void {
	if (models.length === 0) {
		console.log('\n  No models found.\n');
		return;
	}

	const rows = models.map((model) => [
		model.name,
		`${getStatusIcon(model.status)} ${getStatusLabel(model.status)}`,
		model.lastRefresh ? formatRelativePast(model.lastRefresh) : '—',
		`Every ${model.schedule}h`
	]);

	const table = renderCompactTable(['Model', 'Status', 'Last Refresh', 'Schedule'], rows);
	console.log('');
	console.log(
		table
			.split('\n')
			.map((line) => `  ${line}`)
			.join('\n')
	);
	console.log('');

	// Error detail is for humans — to stderr so it never pollutes captured output.
	for (const m of models.filter((m) => m.status === 'ERROR')) {
		console.error(`  ✗ ${m.name}: ${m.error ?? 'Unknown error'}`);
	}
}

export async function listModelsCommand(opts: OutputOptions): Promise<void> {
	await ensureAuthenticated();

	try {
		const models = await fetchModels();

		// Pretty (human) view: the aligned status table.
		if (resolveFormat(opts, 'structured') === 'table') {
			printTable(models);
			process.exit(0);
		}

		// Machine view: full objects under --verbose, else a minimal summary.
		const payload = opts.verbose
			? models
			: models.map((m) => ({ name: m.name, status: m.status, lastRefresh: m.lastRefresh }));
		printResult({ kind: 'structured', value: payload }, opts);
		process.exit(0);
	} catch (err) {
		fail(err, opts);
	}
}
