import { describe, test, expect } from 'vitest';
import { buildThemes } from './build-themes';
import { resolveThemeOverrides } from './resolve-theme';
import { DEFAULT_THEME } from '../constants/default-theme';
import { createTheme } from '../user-components/tags/echarts/echarts-themes';

// buildThemes flattens the per-mode config tokens onto each mode's Theme. The
// conditional spreads (light hex on light / dark hex on dark) and the
// `!== undefined` guards that intentionally pass through `false`/`0` are the
// branches that silently regress, so they're asserted directly here.
describe('buildThemes — per-mode chart/table/sidebar derivation', () => {
	test('chart color tokens land on the matching mode', () => {
		const config = resolveThemeOverrides(DEFAULT_THEME, {
			chart: {
				gridlineColor: { light: '#111111', dark: '#eeeeee' },
				axisLabelColor: { light: '#222222', dark: '#dddddd' },
				baselineColor: { light: '#333333', dark: '#cccccc' }
			}
		});
		const themes = buildThemes(config);
		expect(themes.light.chart?.gridlineColor).toBe('#111111');
		expect(themes.dark.chart?.gridlineColor).toBe('#eeeeee');
		expect(themes.light.chart?.axisLabelColor).toBe('#222222');
		expect(themes.dark.chart?.axisLabelColor).toBe('#dddddd');
		expect(themes.light.chart?.baselineColor).toBe('#333333');
		expect(themes.dark.chart?.baselineColor).toBe('#cccccc');
	});

	test('chart scalar/boolean tokens pass through, including false and 0', () => {
		const config = resolveThemeOverrides(DEFAULT_THEME, {
			chart: {
				barRadius: 0,
				smooth: false,
				areaGradient: false,
				gridlines: false,
				baselines: false,
				animateIntro: false,
				animateUpdates: false
			}
		});
		const { chart } = buildThemes(config).light;
		expect(chart?.barRadius).toBe(0);
		expect(chart?.smooth).toBe(false);
		expect(chart?.areaGradient).toBe(false);
		expect(chart?.gridlines).toBe(false);
		expect(chart?.baselines).toBe(false);
		expect(chart?.animateIntro).toBe(false);
		expect(chart?.animateUpdates).toBe(false);
	});

	test('animation toggles default on and ride on chart (not a separate group)', () => {
		const themes = buildThemes(DEFAULT_THEME);
		expect(themes.light.chart?.animateIntro).toBe(true);
		expect(themes.light.chart?.animateUpdates).toBe(true);
		// the old top-level group is gone
		expect((themes.light as unknown as { animation?: unknown }).animation).toBeUndefined();
	});

	test('table color tokens land per-mode; booleans incl. false pass through', () => {
		const config = resolveThemeOverrides(DEFAULT_THEME, {
			table: {
				barColor: { light: '#aa0000', dark: '#00aa00' },
				rowLines: false,
				rowShading: true
			}
		});
		const themes = buildThemes(config);
		expect(themes.light.table?.barColor).toBe('#aa0000');
		expect(themes.dark.table?.barColor).toBe('#00aa00');
		expect(themes.light.table?.rowLines).toBe(false);
		expect(themes.light.table?.rowShading).toBe(true);
	});

	test('sidebar bundle derived only when sidebarBackground is set, contrasting its own surface', () => {
		expect(buildThemes(DEFAULT_THEME).light.sidebar).toBeUndefined();

		const themes = buildThemes(
			resolveThemeOverrides(DEFAULT_THEME, {
				colors: { sidebarBackground: { light: '#101010', dark: '#fafafa' } }
			})
		);
		// light mode here has a near-black sidebar bg -> derived light foreground
		expect(themes.light.sidebar?.background).toBe('#101010');
		expect(themes.light.sidebar?.foreground).toBe('#f8fafc');
		// dark mode has a near-white sidebar bg -> derived dark foreground
		expect(themes.dark.sidebar?.background).toBe('#fafafa');
		expect(themes.dark.sidebar?.foreground).toBe('#0f172a');
	});
});

describe('createTheme — chart animation tokens', () => {
	test('animate* false zeroes the registered ECharts intro/update durations', () => {
		const themes = buildThemes(
			resolveThemeOverrides(DEFAULT_THEME, {
				chart: { animateIntro: false, animateUpdates: false }
			})
		);
		const theme = createTheme(themes.light, 'light') as unknown as {
			animationDuration?: number;
			animationDurationUpdate?: number;
		};
		expect(theme.animationDuration).toBe(0);
		expect(theme.animationDurationUpdate).toBe(0);
	});

	test('default (animate* true) leaves the durations unset so ECharts defaults apply', () => {
		const theme = createTheme(buildThemes(DEFAULT_THEME).light, 'light') as unknown as {
			animationDuration?: number;
			animationDurationUpdate?: number;
		};
		expect(theme.animationDuration).toBeUndefined();
		expect(theme.animationDurationUpdate).toBeUndefined();
	});
});
