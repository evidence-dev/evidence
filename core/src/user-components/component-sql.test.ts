import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { UserComponent } from './types';

const tagsDir = path.join(import.meta.dirname, 'tags');

const userComponents = import.meta.glob<UserComponent>('./tags/**/user-component.ts', {
	eager: true,
	import: 'userComponent'
});

/**
 * Tags that send SQL but can't have a `sql` export: sandboxed author JavaScript
 * builds the SQL at runtime and sends it through `connection.query()`.
 */
/** Tags still being moved onto the contract while the stack lands. Must stay empty. */
const NOT_YET_MIGRATED = new Set<string>([
	'delta',
	'value',
	'image',
	'heat_grid',
	'progress_bars',
	'conditional/if',
	'map/area_layer',
	'map/heatmap_layer',
	'map/point_layer',
	'polar_chart',
	'radar_chart',
	'funnel_chart',
	'treemap',
	'sankey_chart',
	'chord_chart',
	'heatmap',
	'calendar_heatmap',
	'candlestick',
	'waterfall_chart',
	'series_charts/horizontal_bar_chart',
	'histogram',
	'dimension_grid',
	'sparkline',
	'custom_echart',
	'repeat',
	'table_filter',
	'series_charts/combo_chart/references/reference_area',
	'series_charts/combo_chart/references/reference_line',
	'series_charts/combo_chart/references/reference_point',
	'dropdown',
	'button_group',
	'input_tabs',
	'slider',
	'table',
	'download',
	'series_charts/combo_chart',
	'series_charts/line_chart',
	'series_charts/bar_chart',
	'series_charts/area_chart',
	'series_charts/scatter_chart',
	'series_charts/bubble_chart'
]);

/** Tags that construct no Query themselves but render one that does, so they export its `sql`. */
const RENDERS_A_QUERYING_TAG = new Set<string>([
	'series_charts/line_chart',
	'series_charts/bar_chart',
	'series_charts/area_chart',
	'series_charts/scatter_chart',
	'series_charts/bubble_chart'
]);

const NO_STATIC_SQL = new Map<string, string>([
	['custom_map', 'sandboxed author code issues its own queries'],
	['html', 'sandboxed author code issues its own queries']
]);

function sourceFiles(dir: string): string[] {
	return fs
		.readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((f) => /\.(svelte|ts)$/.test(f) && !/\.(test|spec)\.ts$/.test(f))
		.map((f) => path.join(dir, f));
}

/** The nearest directory at or above `file` that holds a user-component.ts. */
function owningTagDir(file: string): string | undefined {
	let dir = path.dirname(file);
	while (dir.startsWith(tagsDir)) {
		if (fs.existsSync(path.join(dir, 'user-component.ts'))) return dir;
		dir = path.dirname(dir);
	}
	return undefined;
}

function tagsConstructingQuery(): Map<string, string[]> {
	const byTag = new Map<string, string[]>();
	for (const file of sourceFiles(tagsDir)) {
		// A Query, or a direct connection.query() (download runs its SQL on click).
		if (!/\bnew Query\s*[<(]|\bconnection\.query\s*\(/.test(fs.readFileSync(file, 'utf8')))
			continue;
		const tagDir = owningTagDir(file);
		if (!tagDir) throw new Error(`${file} constructs a Query outside any tag`);
		const key = path.relative(tagsDir, tagDir);
		byTag.set(key, [...(byTag.get(key) ?? []), path.relative(tagsDir, file)]);
	}
	return byTag;
}

function userComponentFor(tagKey: string): UserComponent {
	const component = userComponents[`./tags/${tagKey}/user-component.ts`];
	if (!component) throw new Error(`No userComponent export in tags/${tagKey}/user-component.ts`);
	return component;
}

describe('component SQL contract', () => {
	const byTag = tagsConstructingQuery();

	it('finds the tags that construct a Query', () => {
		expect(byTag.size).toBeGreaterThan(30);
	});

	it.each([...byTag.keys()].filter((k) => !NO_STATIC_SQL.has(k) && !NOT_YET_MIGRATED.has(k)))(
		'%s exports `sql` because it constructs a Query',
		(tagKey) => {
			expect(
				userComponentFor(tagKey).sql,
				`tags/${tagKey} constructs a Query (${byTag.get(tagKey)?.join(', ')}) ` +
					'but its user-component.ts has no `sql` export. Add tags/<name>/sql.ts ' +
					'(see component-sql.ts) and export it.'
			).toBeDefined();
		}
	);

	it('NOT_YET_MIGRATED lists only tags that send SQL and lack `sql`', () => {
		for (const tagKey of NOT_YET_MIGRATED) {
			expect(byTag.has(tagKey) || RENDERS_A_QUERYING_TAG.has(tagKey), tagKey).toBe(true);
			expect(userComponentFor(tagKey).sql, `${tagKey} exports sql; drop it from the list`).toBe(
				undefined
			);
		}
	});

	it.each([...NO_STATIC_SQL])('%s sends SQL but has no static `sql` (%s)', (tagKey) => {
		expect(byTag.has(tagKey), `${tagKey} no longer sends SQL; drop it from NO_STATIC_SQL`).toBe(
			true
		);
		expect(userComponentFor(tagKey).sql).toBeUndefined();
	});

	it.each([...RENDERS_A_QUERYING_TAG].filter((k) => !NOT_YET_MIGRATED.has(k)))(
		'%s exports `sql` for the tag it renders',
		(tagKey) => {
			expect(byTag.has(tagKey), `${tagKey} constructs a Query itself now`).toBe(false);
			expect(userComponentFor(tagKey).sql).toBeDefined();
		}
	);

	it('tags without a Query export no `sql`', () => {
		for (const [file, component] of Object.entries(userComponents)) {
			const tagKey = path.dirname(file).replace(/^\.\/tags\//, '');
			if (byTag.has(tagKey) || RENDERS_A_QUERYING_TAG.has(tagKey)) continue;
			expect(component?.sql, `${tagKey} exports sql but constructs no Query`).toBeUndefined();
		}
	});
});
