/**
 * Connectors command — list connectors with health status
 */

import { loadCredentials } from './storage.ts';
import { ensureAuthenticated } from './auth.ts';
import { renderCompactTable } from './table.ts';
import { printResult, resolveFormat, fail, type OutputOptions } from './output.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

interface Connector {
	name: string;
	type: string;
	status: string;
	statusDetail: string | null;
	lastSync: string | null;
	schedule: string | null;
	tables: number;
	references: number;
}

interface ConnectorsResponse {
	connectors: Connector[];
	refreshToken?: string;
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

function formatRelativeFuture(isoDate: string): string {
	const diff = new Date(isoDate).getTime() - Date.now();
	if (diff <= 0) return 'now';
	const mins = Math.floor(diff / 60000);
	if (mins < 60) return `in ${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `in ${hours}h`;
	const days = Math.floor(hours / 24);
	return `in ${days}d`;
}

function getStatusIcon(status: string): string {
	const lower = status.toLowerCase();
	if (lower === 'up to date') return '✓';
	if (lower === 'warning') return '⚠';
	if (lower === 'error') return '✗';
	if (lower === 'paused') return '⏸';
	if (lower === 'initial sync') return '◷';
	if (lower === 'setup incomplete') return '○';
	return '?';
}

function formatNextSync(nextSync: 'syncing' | string | null): string {
	if (nextSync === 'syncing') return 'Syncing';
	if (nextSync && typeof nextSync === 'string') return formatRelativeFuture(nextSync);
	return '—';
}

async function fetchConnectors(): Promise<ConnectorsResponse> {
	const credentials = await loadCredentials();
	if (!credentials?.refreshToken && !credentials?.aptToken) {
		throw new Error('Not authenticated. Run `evidence login` first.');
	}
	if (!credentials.organizationId) {
		throw new Error('No organization selected. Run `evidence login` to authenticate.');
	}

	const response = await fetch(`${STUDIO_HOST}/api/cli/connectors`, {
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
		throw new Error(`Failed to fetch connectors: ${response.status} ${text}`);
	}

	return response.json();
}

function printTable(connectors: Connector[]): void {
	if (connectors.length === 0) {
		console.log('  No connectors found.\n');
		return;
	}

	const rows = connectors.map((conn) => [
		conn.name,
		conn.type,
		`${getStatusIcon(conn.status)} ${conn.status}`,
		conn.lastSync ? formatRelativePast(conn.lastSync) : '—',
		conn.schedule ?? '—',
		conn.tables > 0 ? String(conn.tables) : '—',
		conn.references > 0 ? String(conn.references) : '—'
	]);

	const table = renderCompactTable(
		['Connector', 'Type', 'Status', 'Last Sync', 'Schedule', 'Tables', 'Refs'],
		rows
	);
	console.log(
		table
			.split('\n')
			.map((line) => `  ${line}`)
			.join('\n')
	);
	console.log('');
}

export async function listConnectors(opts: OutputOptions): Promise<void> {
	await ensureAuthenticated();

	try {
		const { connectors } = await fetchConnectors();

		// Pretty (human) view: the aligned status table plus error/warning detail.
		if (resolveFormat(opts, 'structured') === 'table') {
			console.log('');
			printTable(connectors);

			// Error/warning detail is for humans — to stderr so it never pollutes
			// a captured table on stdout.
			for (const c of connectors.filter((c) => c.status === 'Error')) {
				console.error(`  ✗ ${c.name}: ${c.statusDetail ?? 'Error'}`);
			}
			for (const c of connectors.filter((c) => c.status === 'Warning')) {
				console.error(`  ⚠ ${c.name}: ${c.statusDetail ?? 'Warning'}`);
			}
			process.exit(0);
		}

		// Machine view: full objects under --verbose, else a minimal summary.
		const payload = opts.verbose
			? connectors
			: connectors.map((c) => ({ name: c.name, type: c.type, status: c.status }));
		printResult({ kind: 'structured', value: payload }, opts);
		process.exit(0);
	} catch (err) {
		fail(err, opts);
	}
}
