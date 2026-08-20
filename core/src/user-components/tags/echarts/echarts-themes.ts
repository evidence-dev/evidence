import type { Theme } from '../../../types/theme';
import { DEFAULT_THEME } from '../../../constants/default-theme';
import { buildThemes } from '../../../theme/build-themes';
import { getThemeToken } from '../../../theme/get-theme-token';
import chroma from 'chroma-js';

/**
 * Default color palettes for charts (used when no theme or custom colors are set)
 */
export const colorPalettes = {
	light: [
		'#154886',
		'#45a1bf',
		'#a5cdee',
		'#8dacbf',
		'#85c7c6',
		'#d2c6ac',
		'#f4b548',
		'#8f3d56',
		'#71b9f4',
		'#46a485'
	],
	dark: [
		'#154886',
		'#45a1bf',
		'#a5cdee',
		'#8dacbf',
		'#85c7c6',
		'#d2c6ac',
		'#f4b548',
		'#8f3d56',
		'#71b9f4',
		'#46a485'
	]
};

/**
 * Create an ECharts theme from a Theme object
 * This is the single source of truth for echarts theming - follows Evidence's pattern
 *
 * @param theme - Theme object with colors, colorPalettes, colorScales
 * @param mode - 'light' or 'dark' mode
 * @param useCardColors - Whether to use card-derived colors (for charts inside cards)
 */
export const createTheme = (
	theme: Theme,
	mode: 'light' | 'dark',
	useCardColors: boolean = false
) => {
	// Select color tokens based on context (card vs page)
	const background = getThemeToken(theme, 'background', useCardColors);
	const foreground = getThemeToken(theme, 'foreground', useCardColors);
	const mutedForeground = getThemeToken(theme, 'mutedForeground', useCardColors);
	const border = getThemeToken(theme, 'border', useCardColors);

	// Apply shadcn tokens to ECharts theme elements; explicit chart theme
	// tokens take precedence over the derived defaults.
	const axisTitleBackgroundColor = background;
	// Gridlines read as background structure, not as content. In light mode
	// we soften them one brightness step from the shared `border` token so
	// they don't compete with the plotted data — UI borders (table rows,
	// inputs) stay on the original `border` and remain matched to their
	// intended weight.
	const defaultGridlineColor =
		chroma(border).luminance() > 0.5 ? chroma(border).brighten(0.2).hex() : border;
	const gridlineColor = theme.chart?.gridlineColor ?? defaultGridlineColor;
	const axisLabelColor = theme.chart?.axisLabelColor ?? mutedForeground;
	const gridlines = theme.chart?.gridlines ?? true;
	const baselines = theme.chart?.baselines ?? false;
	// The baseline line always renders (to anchor the plot area's bottom edge).
	// `chart.baselines` controls how visible it is:
	// - `true`: prominent muted-foreground.
	// - `false` (default): sits about a third of the way from the gridline
	//   color toward the muted-foreground, so it reads as a distinct axis
	//   anchor without punching through as a heavy frame line. Pure gridline
	//   was too subtle; muted-foreground was too heavy.
	// Explicit `chart.baselineColor` overrides both modes.
	const subtleBaselineColor = chroma.mix(gridlineColor, mutedForeground, 0.2, 'lab').hex();
	const axisBaselineColor =
		theme.chart?.baselineColor ?? (baselines ? mutedForeground : subtleBaselineColor);
	const axisTickColor = axisBaselineColor;
	const fontFamily = theme.chart?.fontFamily ?? theme.fonts?.body ?? 'Geist, sans-serif';
	const legendTextColor = mutedForeground;
	const legendPageIconColor = mutedForeground;
	const legendPageTextColor = mutedForeground;
	const tooltipBorderColor = border;
	const tooltipBackgroundColor = background;
	const tooltipTextColor = foreground;
	const titleColor = foreground;
	// Subtitle is chart secondary text like axis labels/titles — track the same
	// token so a single theme knob controls all of them.
	const subtitleColor = axisLabelColor;

	// Sticker-style axis titles, in three layers: the background box renders at
	// backgroundZ 1 (above gridlines, below series) so it cuts gridlines clean
	// through the whole title — including between words — without punching a
	// hole in data that reaches it; z 100 lifts the glyphs above series; a thin
	// round-join halo (textBorder) keeps the text legible where data passes
	// under it. z/backgroundZ/lineJoin/lineCap on nameTextStyle rely on our
	// echarts AxisBuilder + zrender Text patches.
	// No horizontal padding here: leading padding would shift the glyphs off the
	// axis anchor. Charts that want the box to overhang past the text (so the
	// gridline resumes with a gap) set trailing-only padding per axis side.
	const axisTitleTextStyle = {
		color: axisLabelColor,
		backgroundColor: background,
		backgroundZ: 1,
		padding: [1, 0],
		textBorderColor: background,
		textBorderWidth: 3,
		lineJoin: 'round',
		lineCap: 'round',
		z: 100
	};

	return {
		darkMode: mode === 'dark',
		backgroundColor: 'transparent',
		// Chart animation theme tokens: animateIntro gates the initial draw-in,
		// animateUpdates gates data-update animation. Unset (default) keeps ECharts
		// defaults. (The chart components also gate their hardcoded option-level
		// durations on these via the echarts action, since setOption wins over the
		// registered theme.)
		...(theme.chart?.animateIntro === false ? { animationDuration: 0, animationDelay: 0 } : {}),
		...(theme.chart?.animateUpdates === false
			? { animationDurationUpdate: 0, animationDelayUpdate: 0 }
			: {}),
		textStyle: {
			fontFamily,
			textBorderWidth: 0,
			color: mutedForeground
		},
		color: theme.colorPalettes.default ?? colorPalettes[mode],
		title: {
			padding: 0,
			itemGap: 7,
			textStyle: {
				fontSize: 14,
				color: titleColor
			},
			subtextStyle: {
				fontSize: 13,
				color: subtitleColor,
				overflow: 'break'
			},
			top: '1px'
		},
		line: {
			lineStyle: {
				width: 1.75,
				join: 'round'
			},
			symbolSize: 0,
			symbol: 'circle',
			smooth: theme.chart?.smooth ?? false
		},
		// Top-only corner radius so vertical bars never get a rounded bottom. This
		// theme default rounds every series, so stacked charts clear it on all but
		// the topmost segment (ComboChart) / data-end segment (HorizontalBarChart).
		...(theme.chart?.barRadius
			? {
					bar: {
						itemStyle: {
							borderRadius: [theme.chart.barRadius, theme.chart.barRadius, 0, 0]
						}
					}
				}
			: {}),
		radar: {
			itemStyle: {
				borderWidth: 0
			},
			lineStyle: {
				width: 2
			},
			symbolSize: 0,
			symbol: 'circle',
			smooth: false,
			label: {
				color: mutedForeground
			}
		},
		pie: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			label: {
				textBorderWidth: 0,
				color: mutedForeground
			},
			emphasis: {
				label: {
					textBorderWidth: 0,
					color: mutedForeground
				}
			}
		},
		scatter: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			label: {
				color: mutedForeground
			}
		},
		boxplot: {
			itemStyle: {
				borderWidth: 1.5
			}
		},
		parallel: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			}
		},
		sankey: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			label: {
				color: mutedForeground
			}
		},
		funnel: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			label: {
				color: mutedForeground
			}
		},
		gauge: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			label: {
				color: mutedForeground
			}
		},
		candlestick: {
			itemStyle: {
				color: '#eb5454',
				color0: '#47b262',
				borderColor: '#eb5454',
				borderColor0: '#47b262',
				borderWidth: 1
			}
		},
		graph: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			},
			lineStyle: {
				width: 1,
				color: '#aaaaaa'
			},
			symbolSize: 0,
			symbol: 'circle',
			smooth: false,
			color: theme.colorPalettes.default ?? colorPalettes[mode],
			label: {
				color: foreground
			}
		},
		map: {
			itemStyle: {
				areaColor: '#eee',
				borderColor: '#444',
				borderWidth: 0.5
			},
			label: {
				color: '#000'
			},
			emphasis: {
				itemStyle: {
					areaColor: 'rgba(255,215,0,0.8)',
					borderColor: '#444',
					borderWidth: 1
				},
				label: {
					color: 'rgb(100,0,0)'
				}
			}
		},
		geo: {
			itemStyle: {
				areaColor: '#eee',
				borderColor: '#444',
				borderWidth: 0.5
			},
			label: {
				color: '#000'
			},
			emphasis: {
				itemStyle: {
					areaColor: 'rgba(255,215,0,0.8)',
					borderColor: '#444',
					borderWidth: 1
				},
				label: {
					color: 'rgb(100,0,0)'
				}
			}
		},
		categoryAxis: {
			axisLine: {
				// Line always renders — `baselines` toggles its color between
				// prominent and gridline-matched (see axisBaselineColor above).
				show: true,
				lineStyle: {
					color: axisBaselineColor
				}
			},
			axisTick: {
				show: false,
				lineStyle: {
					color: axisTickColor
				},
				length: 3,
				alignWithLabel: true
			},
			axisLabel: {
				show: true,
				color: axisLabelColor
			},
			splitLine: {
				show: false,
				lineStyle: {
					color: [gridlineColor]
				}
			},
			splitArea: {
				show: false,
				areaStyle: {
					color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
				}
			},
			nameTextStyle: axisTitleTextStyle
		},
		valueAxis: {
			axisLine: {
				show: false,
				lineStyle: {
					color: axisBaselineColor
				}
			},
			axisTick: {
				show: false,
				lineStyle: {
					color: axisTickColor
				},
				length: 2
			},
			axisLabel: {
				show: true,
				color: axisLabelColor
			},
			splitLine: {
				show: gridlines,
				lineStyle: {
					color: [gridlineColor],
					width: 1
				}
			},
			splitArea: {
				show: false,
				areaStyle: {
					color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
				}
			},
			nameTextStyle: axisTitleTextStyle
		},
		logAxis: {
			axisLine: {
				show: false,
				lineStyle: {
					color: axisBaselineColor
				}
			},
			axisTick: {
				show: false,
				lineStyle: {
					color: axisTickColor
				},
				length: 2
			},
			axisLabel: {
				show: true,
				color: axisLabelColor
			},
			splitLine: {
				show: gridlines,
				lineStyle: {
					color: [gridlineColor]
				}
			},
			splitArea: {
				show: false,
				areaStyle: {
					color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
				}
			},
			nameTextStyle: axisTitleTextStyle
		},
		timeAxis: {
			axisLine: {
				show: true,
				lineStyle: {
					color: axisBaselineColor
				}
			},
			axisTick: {
				show: true,
				lineStyle: {
					color: axisTickColor
				},
				length: 3
			},
			axisLabel: {
				show: true,
				color: axisLabelColor,
				// ECharts styles first-of-period time labels (e.g. years) via the
				// built-in 'primary' rich style, which doesn't inherit axisLabel
				// color — without this they fall back to the mode default
				rich: {
					primary: {
						fontWeight: 'bold',
						color: axisLabelColor
					}
				}
			},
			splitLine: {
				show: false,
				lineStyle: {
					color: [gridlineColor]
				}
			},
			splitArea: {
				show: false,
				areaStyle: {
					color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
				}
			},
			nameTextStyle: axisTitleTextStyle
		},
		calendar: {
			itemStyle: {
				borderColor: border // Subtle borders around each day cell
			},
			splitLine: {
				lineStyle: {
					// Slightly more visible than day borders but still subtle
					color:
						chroma(background).luminance() < 0.5
							? chroma(background).brighten(1.5).hex() // Dark bg → slightly brighter than border
							: chroma(background).darken(0.6).hex() // Light bg → slightly darker than border
				}
			},
			dayLabel: {
				color: axisLabelColor
			},
			monthLabel: {
				color: axisLabelColor
			},
			yearLabel: {
				color: axisLabelColor
			}
		},
		toolbox: {
			iconStyle: {
				borderColor: '#999999'
			},
			emphasis: {
				iconStyle: {
					borderColor: '#459cde'
				}
			}
		},
		legend: {
			textStyle: {
				padding: [0, 0, 0, -7],
				color: legendTextColor
			},
			icon: 'circle',
			pageIcons: {
				horizontal: [
					'M 17 3 h 2 c 0.386 0 0.738 0.223 0.904 0.572 s 0.115 0.762 -0.13 1.062 L 11.292 15 l 8.482 10.367 c 0.245 0.299 0.295 0.712 0.13 1.062 S 19.386 27 19 27 h -2 c -0.3 0 -0.584 -0.135 -0.774 -0.367 l -9 -11 c -0.301 -0.369 -0.301 -0.898 0 -1.267 l 9 -11 C 16.416 3.135 16.7 3 17 3 Z',
					'M 12 27 h -2 c -0.386 0 -0.738 -0.223 -0.904 -0.572 s -0.115 -0.762 0.13 -1.062 L 17.708 15 L 9.226 4.633 c -0.245 -0.299 -0.295 -0.712 -0.13 -1.062 S 9.614 3 10 3 h 2 c 0.3 0 0.584 0.135 0.774 0.367 l 9 11 c 0.301 0.369 0.301 0.898 0 1.267 l -9 11 C 12.584 26.865 12.3 27 12 27 Z'
				]
			},
			pageIconColor: legendPageIconColor,
			pageIconSize: 12,
			pageTextStyle: {
				color: legendPageTextColor
			},
			pageButtonItemGap: -2,
			animationDurationUpdate: 300
		},
		tooltip: {
			axisPointer: {
				lineStyle: {
					color: '#cccccc',
					width: 1
				},
				crossStyle: {
					color: '#cccccc',
					width: 1
				}
			},
			borderRadius: 4,
			borderWidth: 1,
			borderColor: tooltipBorderColor,
			backgroundColor: tooltipBackgroundColor,
			textStyle: {
				color: tooltipTextColor,
				fontSize: 12,
				fontWeight: 400
			},
			padding: 6
		},
		timeline: {
			lineStyle: {
				color: '#e3e3e3',
				width: 2
			},
			itemStyle: {
				color: '#d6d6d6',
				borderWidth: 1
			},
			controlStyle: {
				color: '#bfbfbf',
				borderColor: '#bfbfbf',
				borderWidth: 1
			},
			checkpointStyle: {
				color: '#8f8f8f',
				borderColor: '#ffffff'
			},
			label: {
				color: '#c9c9c9'
			},
			emphasis: {
				itemStyle: {
					color: '#9c9c9c'
				},
				controlStyle: {
					color: '#bfbfbf',
					borderColor: '#bfbfbf',
					borderWidth: 1
				},
				label: {
					color: '#c9c9c9'
				}
			}
		},
		visualMap: {
			color: theme.colorScales.default ?? ['#c41621', '#e39588', '#f5ed98'],
			textStyle: {
				color: axisLabelColor
			}
		},
		dataZoom: {
			type: 'slider',
			bottom: 10,
			// A compact slider (was 30) reads less chunky and shrinks the bottom
			// gutter it needs. ComboChart mirrors this height + the 10px bottom
			// offset in DATA_ZOOM_SLIDER_EXTRA_GRID_BOTTOM_PX to keep axis labels
			// clear of the slider; keep the two in sync if either changes.
			height: 18,
			showDetail: false,
			handleSize: '80%',
			borderColor: gridlineColor,
			handleStyle: {
				borderColor: gridlineColor,
				color: gridlineColor
			},
			moveHandleStyle: {
				borderColor: gridlineColor,
				color: gridlineColor
			},
			textStyle: {},
			emphasis: {
				handleStyle: {
					borderColor: gridlineColor,
					color: gridlineColor
				},
				moveHandleStyle: {
					borderColor: gridlineColor,
					color: gridlineColor
				}
			}
		},
		markPoint: {
			label: {
				color: foreground
			},
			emphasis: {
				label: {
					color: foreground
				}
			}
		}
	};
};

// Build default themes from DEFAULT_THEME
const defaultThemes = buildThemes(DEFAULT_THEME);

// Export default themes for fallback
export const echartsLightTheme = createTheme(defaultThemes.light, 'light');
export const echartsDarkTheme = createTheme(defaultThemes.dark, 'dark');
export const echartsThemes = {
	light: echartsLightTheme,
	dark: echartsDarkTheme
} as const;
