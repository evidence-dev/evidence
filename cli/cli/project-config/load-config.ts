/**
 * Loads and validates evidence.config.yaml, theme.yaml, and translations.yaml
 * from the project root.
 *
 * Absence of the config file is represented distinctly via `isDefaultConfig: true`
 * and `project.evidence: null` so callers can tell "user opted into the new
 * format" apart from "got defaults silently".
 *
 * Theme and translations files are optional and gracefully degrade if missing
 * or malformed (returning undefined/empty objects respectively).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import {
	projectLayoutSchema,
	projectDateSchema,
	type ParsedProjectLayout,
	type ParsedProjectDate
} from '@evidence/core/config/page-frontmatter-schema';

const CONFIG_FILENAME = 'evidence.config.yaml';
const THEME_FILENAME = 'theme.yaml';
const TRANSLATIONS_FILENAME = 'translations.yaml';
const DEFAULT_PAGES = './pages';

export class ProjectConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ProjectConfigError';
	}
}

export interface ProjectConfig {
	project: {
		name: string;
		/**
		 * The Evidence version that wrote this file (e.g. "0.4.3"), as declared
		 * in `project.evidence`. `null` when no config file is present on disk.
		 */
		evidence: string | null;
	};
	/** The `pages` value as written (or the './pages' default). */
	pages: string;
	/** Absolute filesystem path to the pages directory. */
	pagesDir: string;
	/**
	 * Project-level page layout defaults from the `layout:` block, applied to
	 * every page unless overridden in page frontmatter. Undefined when absent or
	 * malformed (degrades to no defaults, mirroring Studio).
	 */
	layout?: ParsedProjectLayout;
	/**
	 * Project-level date defaults from the `date:` block (first day of week +
	 * default date-range end). Undefined when absent or malformed (degrades to
	 * Evidence defaults, mirroring Studio).
	 */
	date?: ParsedProjectDate;
	/** Theme overrides from theme.yaml, or undefined if missing/malformed. */
	theme?: Record<string, unknown>;
	/** Raw translations.yaml map (language → key map); empty if missing/malformed. */
	translations: Record<string, unknown>;
	/** Absolute path to evidence.config.yaml, or null if absent. */
	configPath: string | null;
	/** True iff no file on disk; the returned config is the silent default. */
	isDefaultConfig: boolean;
}

export async function loadProjectConfig(projectRoot: string): Promise<ProjectConfig> {
	const configPath = path.join(projectRoot, CONFIG_FILENAME);

	let raw: string;
	try {
		raw = await readFile(configPath, 'utf-8');
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			return defaultConfig(projectRoot);
		}
		throw new ProjectConfigError(`Failed to read ${configPath}: ${(e as Error).message}`);
	}

	let parsed: unknown;
	try {
		parsed = yaml.load(raw);
	} catch (e) {
		throw new ProjectConfigError(`Failed to parse ${configPath}: ${(e as Error).message}`);
	}

	const config = parseProjectConfig(parsed, configPath, projectRoot);

	// theme.yaml / translations.yaml are sibling files, read independently and
	// degraded gracefully (a broken one never blocks the config from loading).
	const [theme, translations] = await Promise.all([
		loadProjectTheme(projectRoot),
		loadProjectTranslations(projectRoot)
	]);

	return {
		...config,
		theme,
		translations
	};
}

async function defaultConfig(projectRoot: string): Promise<ProjectConfig> {
	const [theme, translations] = await Promise.all([
		loadProjectTheme(projectRoot),
		loadProjectTranslations(projectRoot)
	]);

	return {
		project: {
			name: path.basename(path.resolve(projectRoot)),
			evidence: null
		},
		pages: DEFAULT_PAGES,
		pagesDir: path.resolve(projectRoot, DEFAULT_PAGES),
		theme,
		translations,
		configPath: null,
		isDefaultConfig: true
	};
}

function parseProjectConfig(
	parsed: unknown,
	configPath: string,
	projectRoot: string
): ProjectConfig {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new ProjectConfigError(`${configPath}: expected a YAML object at the top level`);
	}
	const obj = parsed as Record<string, unknown>;

	const projectRaw = obj.project;
	if (!projectRaw || typeof projectRaw !== 'object' || Array.isArray(projectRaw)) {
		throw new ProjectConfigError(
			`${configPath}: \`project\` must be an object with \`name\` and \`evidence\``
		);
	}
	const project = projectRaw as Record<string, unknown>;

	if (typeof project.name !== 'string' || project.name.trim() === '') {
		throw new ProjectConfigError(`${configPath}: \`project.name\` must be a non-empty string`);
	}

	if (typeof project.evidence !== 'string' || project.evidence.trim() === '') {
		throw new ProjectConfigError(
			`${configPath}: \`project.evidence\` must be a non-empty string ` +
				`(the Evidence version that wrote this config, e.g. "0.4.3")`
		);
	}

	let pages: string = DEFAULT_PAGES;
	if (obj.pages !== undefined) {
		if (typeof obj.pages !== 'string' || obj.pages.trim() === '') {
			throw new ProjectConfigError(`${configPath}: \`pages\` must be a non-empty string path`);
		}
		pages = obj.pages;
	}

	// Lenient like Studio: a malformed `layout:` / `date:` block degrades to no
	// project defaults rather than failing the whole config (a wrong type for one
	// key shouldn't blank every page's settings).
	const layout = obj.layout !== undefined ? projectLayoutSchema.safeParse(obj.layout) : undefined;
	const date = obj.date !== undefined ? projectDateSchema.safeParse(obj.date) : undefined;

	// theme/translations are filled in by loadProjectConfig from their own files.
	return {
		project: {
			name: project.name,
			evidence: project.evidence
		},
		pages,
		pagesDir: path.resolve(projectRoot, pages),
		layout: layout?.success ? layout.data : undefined,
		date: date?.success ? date.data : undefined,
		theme: undefined,
		translations: {},
		configPath,
		isDefaultConfig: false
	};
}

/**
 * Load theme.yaml from the project root, independent of evidence.config.yaml.
 * Returns undefined if the file is missing or malformed (silently degrades).
 *
 * Exposed separately so a broken evidence.config.yaml (which makes
 * `loadProjectConfig` throw) never suppresses a valid theme — mirroring Studio,
 * which reads theme.yaml on its own.
 */
export async function loadProjectTheme(
	projectRoot: string
): Promise<Record<string, unknown> | undefined> {
	const filePath = path.join(projectRoot, THEME_FILENAME);
	try {
		const content = await readFile(filePath, 'utf-8');
		const parsed = yaml.load(content);

		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return undefined;
		}

		return parsed as Record<string, unknown>;
	} catch {
		// File not found or parse error — silently degrade
		return undefined;
	}
}

/**
 * Load translations.yaml from the project root, independent of
 * evidence.config.yaml. Returns an empty object if the file is missing or
 * malformed (silently degrades). See `loadProjectTheme` for the rationale.
 */
export async function loadProjectTranslations(
	projectRoot: string
): Promise<Record<string, unknown>> {
	const filePath = path.join(projectRoot, TRANSLATIONS_FILENAME);
	try {
		const content = await readFile(filePath, 'utf-8');
		// JSON_SCHEMA stops YAML boolean aliases (on/yes/off/no) being coerced to
		// booleans. (Bare integers like 2024 still parse as numbers.)
		const parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA });

		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return {};
		}

		return parsed as Record<string, unknown>;
	} catch {
		// File not found or parse error — silently degrade to empty
		return {};
	}
}
