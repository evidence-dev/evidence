/**
 * Validate all markdown files in the project.
 * Returns structured JSON with validation errors for each file.
 *
 * Loads warehouse metadata when available (connection.yaml or an authenticated
 * managed connection) for full Studio-parity validation, else falls back to
 * syntax-only — see loadMetadata.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	discoverMarkdownFiles,
	getHomeFile,
	discoverSqlFiles,
	discoverPartials,
	discoverProjectSqlFiles,
	discoverProjectPartials,
	discoverProjectComponents,
	projectRootRelativePath,
	type MarkdownFile
} from '$lib/markdown/files.server';
import { cliUsesRelativeResolution } from '$lib/markdown/resolution';
import { withTimeout } from '$lib/timeout';
import { process as processMarkdown } from '$lib/markdown';
import { getProjectCwd } from '$lib/server/project-cwd';
import { loadTranslations } from '$lib/server/translations.server';
import { loadConnectionConfig } from '$cli/connection';
import { loadCredentials } from '$lib/auth/credentials.server';
import { ServerQueryService, type ConnectionType } from '$lib/server/ServerQueryService';
import { Metadata } from '@evidence/core/metadata/Metadata.svelte';
import type { WarehouseMode } from '@evidence/core/connectors/warehouse-mode';
import pc from 'picocolors';

/** Coarse progress to stderr (so `--json` stdout stays pipeable), emitted only
 * when the CLI requested it via `?progress=1`. Scoped per request — no env. */
function makeProgressLogger(enabled: boolean): (message: string) => void {
	return (message) => {
		if (enabled) process.stderr.write(pc.dim(`  ${message}\n`));
	};
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Resolve a user-supplied page arg (`orders.md`, `pages/orders`, `reports/q4`)
 * against discovered files — tolerant of a leading `pages/`, a `.md` suffix, or a
 * bare filename. */
function findTargetFile(files: MarkdownFile[], target: string): MarkdownFile | undefined {
	const slug = target
		.replace(/\\/g, '/')
		.replace(/^\.\//, '')
		.replace(/^pages\//, '')
		.replace(/\.md$/, '');
	return files.find(
		(f) =>
			f.slug === slug ||
			f.name === slug ||
			f.path.replace(/\\/g, '/').endsWith(`/${slug}.md`)
	);
}

type FileError = {
	line: number;
	endLine: number;
	severity: string;
	message: string;
	id?: string;
	component?: string;
};
type FileResult = { path: string; errors: FileError[] };

/** Cap on warehouse introspection so a reachable-but-unresponsive engine can't
 * stall validation — Metadata.load() retries with no network timeout. */
const METADATA_LOAD_TIMEOUT_MS = 15_000;

export const GET: RequestHandler = async ({ url }) => {
	const cwd = getProjectCwd();
	const logProgress = makeProgressLogger(url.searchParams.get('progress') === '1');

	const useRelativeResolution = cliUsesRelativeResolution();
	const [markdownFiles, homeFile, sqlFiles, partials, customComponents] = await Promise.all([
		discoverMarkdownFiles(cwd),
		getHomeFile(cwd),
		useRelativeResolution ? discoverProjectSqlFiles(cwd) : discoverSqlFiles(cwd),
		useRelativeResolution ? discoverProjectPartials(cwd) : discoverPartials(cwd),
		// Components are a new-structure-only feature; for legacy projects we
		// pass an empty map so the call shape stays uniform.
		useRelativeResolution
			? discoverProjectComponents(cwd)
			: Promise.resolve({} as Record<string, string>)
	]);

	// Include home file if it wasn't already discovered
	const allFiles = [...markdownFiles];
	if (homeFile && !allFiles.some((f) => f.path === homeFile.path)) {
		allFiles.unshift(homeFile);
	}

	// Single-page opt-in (`evidence validate orders.md`): validate just the named
	// page. Still discovers project sql files/partials/metadata so its refs resolve.
	const targetPath = url.searchParams.get('path') ?? undefined;
	let filesToValidate = allFiles;
	if (targetPath) {
		const match = findTargetFile(allFiles, targetPath);
		if (!match) {
			// No `mode` — nothing was validated, so the "syntax-only" note (which
			// implies a missing warehouse connection) would be misleading here.
			return json({
				valid: false,
				fileCount: 0,
				errorCount: 1,
				warningCount: 0,
				files: [
					{
						path: targetPath,
						errors: [
							{ line: 1, endLine: 1, severity: 'error', message: `Page not found: ${targetPath}` }
						]
					}
				]
			});
		}
		filesToValidate = [match];
	}

	logProgress(`Found ${plural(filesToValidate.length, 'page')}`);
	logProgress('Loading warehouse metadata…');

	const { metadata, queryService, connectionType, mode, metadataError } = await loadMetadata(cwd);

	logProgress(
		mode === 'warehouse'
			? `Connected to ${connectionType ?? 'warehouse'} — schema loaded`
			: 'No warehouse connection — running syntax-only checks'
	);
	logProgress(`Validating ${plural(filesToValidate.length, 'page')}…`);

	// Resolve translations once so `$translations.*` references validate instead
	// of reporting as undefined keys.
	const translations = await loadTranslations(cwd, null);

	let totalErrors = 0;
	let totalWarnings = 0;
	const files: FileResult[] = [];

	for (const file of filesToValidate) {
		try {
			const { validationErrors } = await processMarkdown(file.content, {
				sqlFiles,
				partials,
				customComponents,
				connectionType: connectionType ?? undefined,
				metadata,
				queryService,
				basePath: useRelativeResolution
					? projectRootRelativePath(cwd, file.path)
					: undefined,
				useRelativeResolution,
				translations
			});

			const errors = validationErrors.map((err) => {
				// Markdoc lines are 0-indexed with an exclusive end (one past the last
				// line), so the start gets +1 but the end is already the 1-indexed last
				// line. Clamp to start so single-line nodes report a single line.
				const startLine0 = err.location?.start.line ?? err.lines?.[0] ?? 0;
				const endExclusive = err.location?.end.line ?? err.lines?.[1] ?? startLine0 + 1;
				const line = startLine0 + 1;
				const endLine = Math.max(line, endExclusive);

				return {
					line,
					endLine,
					severity: err.error.level,
					message: err.error.message,
					id: err.error.id,
					...(err.type === 'tag' ? { component: (err as { tag?: string }).tag } : {})
				};
			});

			totalErrors += errors.filter((e) => e.severity === 'error').length;
			totalWarnings += errors.filter((e) => e.severity === 'warning').length;

			files.push({
				path: `pages/${file.slug}.md`,
				errors
			});
		} catch (err) {
			totalErrors += 1;
			files.push({
				path: `pages/${file.slug}.md`,
				errors: [
					{
						line: 1,
						endLine: 1,
						severity: 'error',
						message: `Failed to parse: ${err instanceof Error ? err.message : String(err)}`
					}
				]
			});
		}
	}

	return json({
		valid: totalErrors === 0,
		fileCount: filesToValidate.length,
		errorCount: totalErrors,
		warningCount: totalWarnings,
		mode,
		...(metadataError ? { metadataError } : {}),
		files
	});
};

/**
 * Resolve warehouse metadata. Prefers a local connection.yaml (offline), else
 * the authenticated managed connection. Degrades to syntax-only when neither is
 * available or introspection fails — never blocks validation.
 */
async function loadMetadata(cwd: string): Promise<{
	metadata: Metadata | undefined;
	queryService: ServerQueryService | undefined;
	connectionType: ConnectionType;
	mode: 'warehouse' | 'syntax-only';
	metadataError?: string;
}> {
	let connectionType: ConnectionType = null;
	try {
		const config = await loadConnectionConfig(cwd);
		if (config) connectionType = config.type;
	} catch (e) {
		return {
			metadata: undefined,
			queryService: undefined,
			connectionType: null,
			mode: 'syntax-only',
			metadataError: e instanceof Error ? e.message : 'Failed to load connection.yaml'
		};
	}

	const credentials = await loadCredentials();
	const hasManaged = !connectionType && !!credentials?.organizationId;

	if (!connectionType && !hasManaged) {
		return {
			metadata: undefined,
			queryService: undefined,
			connectionType: null,
			mode: 'syntax-only'
		};
	}

	// connectionType values match WarehouseMode names 1:1; null → managed engine.
	const warehouseMode: WarehouseMode = connectionType ?? 'managed';

	try {
		const queryService = new ServerQueryService(
			credentials?.organizationId ?? 'local',
			connectionType
		);
		const metadata = new Metadata(queryService, { warehouseMode });
		// Metadata.load() logs failures straight to console (warehouse driver +
		// SDK noise) before throwing. We surface the reason via metadataError and
		// degrade cleanly, so mute console for the load to avoid a scary dump.
		await quietly(() =>
			withTimeout(metadata.load(), METADATA_LOAD_TIMEOUT_MS, 'warehouse metadata load timed out')
		);
		return { metadata, queryService, connectionType, mode: 'warehouse' };
	} catch (e) {
		return {
			metadata: undefined,
			queryService: undefined,
			connectionType,
			mode: 'syntax-only',
			metadataError: e instanceof Error ? e.message : 'Failed to load warehouse metadata'
		};
	}
}

/** Run `fn` with console.error/warn muted — for noisy library calls whose
 * failures we handle and report ourselves. Safe only when nothing else logs
 * concurrently (we await this before validating any files). */
async function quietly<T>(fn: () => Promise<T>): Promise<T> {
	const { error, warn } = console;
	console.error = () => {};
	console.warn = () => {};
	try {
		return await fn();
	} finally {
		console.error = error;
		console.warn = warn;
	}
}
