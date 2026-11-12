import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * `formatValue` renders English month/weekday names unless it is handed the
 * page language. Components must therefore reach it through
 * `LocaleContext.formatValue` (language already bound), and the few plain
 * modules that call it directly must accept the language from their caller.
 *
 * This pins that contract: no Svelte component may import `formatValue`, and
 * the set of modules that do is exactly the reviewed allowlist below. Adding a
 * module here is a conscious decision that it threads the language (or has a
 * documented reason not to).
 */
const ALLOWED_DIRECT_IMPORTERS: Record<string, string> = {
	'user-components/common/tooltip-fields.ts': 'language parameter on renderTooltipExtras',
	'user-components/common/pivot-utils.ts': 'PivotConfig.language',
	'user-components/common/comparison-tooltips/tooltipHelpers.ts':
		'comparison values are numeric; month and weekday names cannot appear',
	'user-components/tags/custom_echart/apply-format-codes.ts': 'language parameter',
	'user-components/tags/custom_echart/sandbox/runtime-entry.ts':
		'language arrives in the sandbox init message from EChartSandbox',
	'user-components/tags/map/tooltip-utils.ts': 'TooltipContent.language',
	'user-components/tags/map/area_layer/AreaLayerModel.svelte.ts':
		'getLanguage constructor argument',
	'user-components/tags/series_charts/combo_chart/XAxisModel.svelte.ts': 'XAxisOptions.language',
	'user-components/tags/series_charts/combo_chart/YAxisModel.svelte.ts': 'YAxisOptions.language',
	'user-components/tags/series_charts/combo_chart/series/SeriesModel.svelte.ts':
		'SharedQueryContext.language',
	'user-components/tags/series_charts/combo_chart/references/reference_line/ReferenceLineStaticModel.svelte.ts':
		'getLanguage constructor argument',
	'user-components/tags/series_charts/combo_chart/references/reference_point/ReferencePointStaticModel.svelte.ts':
		'getLanguage constructor argument'
};

const SRC_ROOT = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true, recursive: true })
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name))
		.filter((file) => /\.(ts|svelte)$/.test(file) && !/\.test\.ts$/.test(file));
}

/** Named-import of `formatValue` from the formatValue module (any relative depth). */
const DIRECT_IMPORT =
	/import\s*\{[^}]*\bformatValue\b[^}]*\}\s*from\s*['"](?:\.\.?\/)+formatValue['"]/;

function directImporters(): string[] {
	return sourceFiles(SRC_ROOT)
		.filter((file) => DIRECT_IMPORT.test(readFileSync(file, 'utf8')))
		.map((file) => relative(SRC_ROOT, file).split(sep).join('/'))
		.sort();
}

describe('formatValue callers', () => {
	it('no Svelte component imports formatValue directly (use LocaleContext.formatValue)', () => {
		const components = directImporters().filter((file) => file.endsWith('.svelte'));
		expect(components).toEqual([]);
	});

	it('every direct importer is on the reviewed allowlist, and the allowlist is not stale', () => {
		expect(directImporters()).toEqual(Object.keys(ALLOWED_DIRECT_IMPORTERS).sort());
	});
});
