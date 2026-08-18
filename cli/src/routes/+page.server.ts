/**
 * Home page server - renders home.md from CWD
 */

import type { PageServerLoad } from './$types';
import { stat } from 'fs/promises';
import { process as processMarkdown, serializeTree } from '$lib/markdown';
import {
	getHomeFile,
	discoverSqlFiles,
	discoverPartials,
	discoverProjectSqlFiles,
	discoverProjectPartials,
	discoverProjectComponents,
	discoverProjectMetricFiles,
	hasProjectMetricFiles,
	projectRootRelativePath,
	pageDisplayTitle
} from '$lib/markdown/files.server';
import { cliUsesRelativeResolution } from '$lib/markdown/resolution';
import { loadCredentials } from '$lib/auth/credentials.server';
import { getProjectCwd } from '$lib/server/project-cwd';
import { isServeMode } from '$lib/server/serve-mode';
import { loadTranslations } from '$lib/server/translations.server';

// Track last modified time to detect changes (dev only)
let lastMtime: number | null = null;

// Serve mode discovers project files once per process; restart to pick up edits.
let serveDiscovery: {
	sqlFiles: Record<string, string>;
	partials: Record<string, string>;
	customComponents: Record<string, string>;
	metricFiles: Record<string, string>;
} | null = null;

export const load: PageServerLoad = async ({ url, cookies, setHeaders, parent }) => {
	// Prevent caching so file changes are reflected immediately
	setHeaders({
		'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
	});
	// Serve mode: no Studio session exists — never load stored credentials.
	const isServe = isServeMode();
	const [credentials, { connectionType }] = await Promise.all([
		isServe ? null : loadCredentials(),
		parent()
	]);

	// Get home markdown file from CWD
	const cwd = getProjectCwd();
	const homeFile = await getHomeFile(cwd);

	let markdownData = null;
	// Metric YAML files are discovered per-page (or emptied when there's no home
	// file); hoisted here so the load return can surface them the same way
	// [...path]/+page.server.ts does. CLIPageWrapper reads this to build the
	// metrics catalog for the root page — without it, `metric="..."` on
	// pages/home would silently resolve to nothing.
	let metricFiles: Record<string, string> = {};
	if (homeFile) {
		// Check if file actually changed (dev-only; serve ships immutable content).
		let changed = false;
		if (!isServe) {
			const fileStat = await stat(homeFile.path);
			const mtime = fileStat.mtimeMs;
			changed = lastMtime !== null && mtime !== lastMtime;
			lastMtime = mtime;

			if (changed) {
				console.log(`  ✨ ${new Date().toLocaleTimeString()} → ${homeFile.name}.md`);
			}
		}

		// Discover SQL files and partials. New CLI versions use the project-root
		// model (full-path keys); older behavior stays pages-scoped. Serve mode
		// runs this once per process. Metric YAML files live at the project root
		// regardless of the legacy pages-scoped resolution mode — gated on
		// `hasProjectMetricFiles` so a project without metrics pays a single
		// recursive check, not a full scan. Without this the home page was the
		// ONLY route that dropped metricFiles, so `{% big_value metric="..." /%}`
		// resolved on every subpage but silently failed on the home page.
		const useRelativeResolution = cliUsesRelativeResolution();
		const discovered =
			isServe && serveDiscovery
				? serveDiscovery
				: useRelativeResolution
					? {
							sqlFiles: await discoverProjectSqlFiles(cwd),
							partials: await discoverProjectPartials(cwd),
							customComponents: await discoverProjectComponents(cwd),
							metricFiles: (await hasProjectMetricFiles(cwd))
								? await discoverProjectMetricFiles(cwd)
								: {}
						}
					: {
							sqlFiles: await discoverSqlFiles(cwd),
							partials: await discoverPartials(cwd),
							// Custom components are a new-structure feature; legacy CLI
							// projects don't have a `components/` directory.
							customComponents: {} as Record<string, string>,
							metricFiles: (await hasProjectMetricFiles(cwd))
								? await discoverProjectMetricFiles(cwd)
								: {}
						};
		if (isServe) serveDiscovery = discovered;
		const { sqlFiles, partials, customComponents } = discovered;
		metricFiles = discovered.metricFiles;

		if (Object.keys(sqlFiles).length > 0 && changed) {
			console.log(`  📄 Found ${Object.keys(sqlFiles).length} SQL file(s): ${Object.keys(sqlFiles).join(', ')}`);
		}

		const basePath = useRelativeResolution
			? projectRootRelativePath(cwd, homeFile.path)
			: undefined;

		const translations = await loadTranslations(
			cwd,
			url.searchParams.get('lang') ?? cookies.get('lang') ?? null
		);

		const { tree, validationErrors, serializedInlineQueries, serializedFilters } =
			await processMarkdown(homeFile.content, {
				sqlFiles,
				connectionType,
				partials,
				customComponents,
				basePath,
				useRelativeResolution,
				translations
			});
		markdownData = {
			serializedTree: serializeTree(tree),
			validationErrors,
			serializedInlineQueries,
			serializedFilters,
			sqlFiles,
			fileName: homeFile.name,
			title: pageDisplayTitle(homeFile, true),
			slug: homeFile.slug,
			basePath,
			useRelativeResolution
		};
	}

	if (!credentials) {
		return {
			authenticated: false,
			user: null,
			organizationId: null,
			markdown: markdownData,
			metricFiles
		};
	}

	return {
		authenticated: true,
		user: {
			id: credentials.user.id,
			email: credentials.user.email,
			firstName: credentials.user.firstName,
			lastName: credentials.user.lastName,
			name:
				[credentials.user.firstName, credentials.user.lastName].filter(Boolean).join(' ') || null
		},
		organizationId: credentials.organizationId,
		markdown: markdownData,
		metricFiles
	};
};
