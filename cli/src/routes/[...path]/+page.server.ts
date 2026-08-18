/**
 * Catch-all route for markdown pages
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { stat } from 'fs/promises';
import { process as processMarkdown, serializeTree } from '$lib/markdown';
import {
	getMarkdownFile,
	discoverSqlFiles,
	discoverPartials,
	discoverProjectSqlFiles,
	discoverProjectPartials,
	discoverProjectComponents,
	discoverProjectMetricFiles,
	hasProjectMetricFiles,
	projectRootRelativePath,
	resolvePageSettings,
	pageDisplayTitle
} from '$lib/markdown/files.server';
import { loadProjectConfig } from '$cli/project-config/load-config';
import { cliUsesRelativeResolution } from '$lib/markdown/resolution';
import { loadCredentials } from '$lib/auth/credentials.server';
import { getProjectCwd } from '$lib/server/project-cwd';
import { isServeMode } from '$lib/server/serve-mode';
import { loadTranslations } from '$lib/server/translations.server';
import { resolvePageTheme } from '$lib/server/theme.server';
import { resolveProjectSettings } from '$lib/server/project-settings.server';
import { ServerQueryService } from '$lib/server/ServerQueryService';

// Track last modified times per slug
const lastMtimes = new Map<string, number>();

async function hasFileChanged(slug: string, path: string): Promise<boolean> {
	const fileStat = await stat(path);
	const mtime = fileStat.mtimeMs;
	const lastMtime = lastMtimes.get(slug);
	lastMtimes.set(slug, mtime);
	return lastMtime !== undefined && mtime !== lastMtime;
}

async function discoverProjectFiles(
	cwd: string,
	useRelativeResolution: boolean
): Promise<ProjectDiscovery> {
	// Custom components are a new-structure feature — legacy
	// (pre-project-root) CLI projects don't have a `components/`
	// directory, so we skip the disk scan and pass an empty map.
	const [sqlFiles, partials, customComponents, metricFiles] = useRelativeResolution
		? await Promise.all([
				discoverProjectSqlFiles(cwd),
				discoverProjectPartials(cwd),
				discoverProjectComponents(cwd),
				// Metric YAML files live at the project root regardless of the legacy
				// pages-scoped resolution mode; gated on `hasProjectMetricFiles` so a
				// project without metrics pays a single readdir, not a full scan.
				(await hasProjectMetricFiles(cwd)) ? discoverProjectMetricFiles(cwd) : {}
			])
		: await Promise.all([
				discoverSqlFiles(cwd),
				discoverPartials(cwd),
				Promise.resolve({} as Record<string, string>),
				(await hasProjectMetricFiles(cwd)) ? discoverProjectMetricFiles(cwd) : {}
			]);
	return {
		sqlFiles,
		partials,
		customComponents,
		metricFiles,
		basePathSupport: useRelativeResolution
	};
}

// Cache SQL files (refreshed on each page load for now)
let cachedSqlFiles: Record<string, string> | null = null;

// Serve mode discovers project files once per process; restart to pick up edits.
type ProjectDiscovery = {
	sqlFiles: Record<string, string>;
	partials: Record<string, string>;
	customComponents: Record<string, string>;
	metricFiles: Record<string, string>;
	basePathSupport: boolean;
};
let serveDiscovery: ProjectDiscovery | null = null;

export const load: PageServerLoad = async ({ params, url, cookies, setHeaders, parent }) => {
	// Prevent caching so file changes are reflected immediately
	setHeaders({
		'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
	});

	const cwd = getProjectCwd();
	const slug = params.path;
	const isServe = isServeMode();

	// `.catch` so a malformed evidence.config.yaml degrades to no project layout
	// defaults rather than 500-ing the page (mirrors Studio's graceful read).
	const [credentials, { connectionType }, projectConfig] = await Promise.all([
		isServe ? null : loadCredentials(),
		parent(),
		loadProjectConfig(cwd).catch(() => null)
	]);

	const file = await getMarkdownFile(cwd, slug);

	if (!file) {
		error(404, `Page not found: ${slug}`);
	}

	// Check if file actually changed (dev-only; serve ships immutable content,
	// so skip the stat and the reload logging entirely).
	const changed = !isServe && (await hasFileChanged(slug, file.path));

	if (changed) {
		console.log(`  ✨ ${new Date().toLocaleTimeString()} → ${slug}.md`);
	}

	// Discover SQL files and partials (refresh on each load for dev experience;
	// once per process in serve mode). New CLI versions use the project-root
	// model (full-path keys across pages/queries/partials); older behavior
	// stays pages-scoped.
	const useRelativeResolution = cliUsesRelativeResolution();
	const discovered = isServe
		? (serveDiscovery ??= await discoverProjectFiles(cwd, useRelativeResolution))
		: await discoverProjectFiles(cwd, useRelativeResolution);
	const { sqlFiles, partials, customComponents, metricFiles } = discovered;
	cachedSqlFiles = sqlFiles;

	if (Object.keys(cachedSqlFiles).length > 0 && changed) {
		console.log(
			`  📄 Found ${Object.keys(cachedSqlFiles).length} SQL file(s): ${Object.keys(cachedSqlFiles).join(', ')}`
		);
	}

	const basePath = useRelativeResolution ? projectRootRelativePath(cwd, file.path) : undefined;

	const translations = await loadTranslations(
		cwd,
		url.searchParams.get('lang') ?? cookies.get('lang') ?? null
	);

	// Project theme.yaml merged with this page's frontmatter `theme` block.
	const resolvedPageTheme = await resolvePageTheme(cwd, file.content);

	// Project date config → runtime project settings (first day of week + the
	// computed date-range anchor). Only `custom_sql` hits the warehouse; today/
	// relative resolve in JS, so default projects pay nothing here.
	const projectSettings = await resolveProjectSettings(
		projectConfig?.date,
		new ServerQueryService(credentials?.organizationId ?? '', connectionType)
	);

	const { tree, validationErrors, serializedInlineQueries, serializedFilters } =
		await processMarkdown(file.content, {
			sqlFiles: cachedSqlFiles,
			connectionType,
			partials,
			customComponents,
			basePath,
			useRelativeResolution,
			translations
		});

	return {
		organizationId: credentials?.organizationId ?? null,
		resolvedPageTheme,
		projectSettings,
		metricFiles,
		markdown: {
			serializedTree: serializeTree(tree),
			validationErrors,
			serializedInlineQueries,
			serializedFilters,
			sqlFiles: cachedSqlFiles,
			fileName: file.name,
			title: pageDisplayTitle(file),
			slug: file.slug,
			basePath,
			useRelativeResolution,
			pageSettings: resolvePageSettings(file.content, projectConfig?.layout)
		}
	};
};
