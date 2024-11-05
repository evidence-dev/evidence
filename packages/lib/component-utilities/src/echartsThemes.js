import { themes } from '$evidence/themes';

/** @param {'light' | 'dark'} mode */
const createTheme = (mode) => {
	const axisBaselineColor = themes[mode].colors['base-content-muted'];
	const axisTickColor = themes[mode].colors['base-content-muted'];
	const axisLabelColor = themes[mode].colors['base-content-muted'];
	const gridlineColor = themes[mode].colors['base-300'];
	const axisTitleBackgroundColor = themes[mode].colors['base-100'];
	const legendTextColor = themes[mode].colors['base-content-muted'];
	const legendPageIconColor = themes[mode].colors['base-content-muted'];
	const legendPageTextColor = themes[mode].colors['base-content-muted'];
	const tooltipBorderColor = themes[mode].colors['base-300'];
	const tooltipBackgroundColor = themes[mode].colors['base-100'];
	const tooltipTextColor = themes[mode].colors['base-content'];
	const titleColor = themes[mode].colors['base-content'];
	const subtitleColor = themes[mode].colors['base-content-muted'];

	return {
		darkMode: mode === 'dark', // if true, echarts will automatically update the font colour to work better on dark background
		textStyle: {
			fontFamily: ['Inter', 'sans-serif']
		},
		grid: {
			left: '0%',
			right: '4%',
			bottom: '0%',
			top: '15%',
			containLabel: true
		},
		color: themes[mode].colorPalettes.default,
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
			top: '0%'
		},
		line: {
			itemStyle: {
				borderWidth: 0
			},
			lineStyle: {
				width: 2,
				join: 'round'
			},
			symbolSize: 0,
			symbol: 'circle',
			smooth: false
		},
		radar: {
			itemStyle: {
				borderWidth: 0
			},
			lineStyle: {
				width: 2
			},
			symbolSize: 0,
			symbol: 'circle',
			smooth: false
		},
		pie: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			}
		},
		scatter: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			}
		},
		boxplot: {
			itemStyle: {
				borderWidth: 1.5
				// borderColor: '#cccccc'
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
			}
		},
		funnel: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
			}
		},
		gauge: {
			itemStyle: {
				borderWidth: 0,
				borderColor: '#cccccc'
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
			color: [
				'#923d59',
				'#488f96',
				'#518eca',
				'#b3a9a0',
				'#ffc857',
				'#495867',
				'#bfdbf7',
				'#bc4749',
				'#eeebd0'
			],
			label: {
				color: '#f2f2f2'
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
			}
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
				show: true,
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
			nameTextStyle: {
				backgroundColor: axisTitleBackgroundColor
			}
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
				show: true,
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
			nameTextStyle: {
				backgroundColor: axisTitleBackgroundColor
			}
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
			// "padding": [15,0,0,0],
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
			color: ['#c41621', '#e39588', '#f5ed98']
		},
		dataZoom: {
			handleSize: 'undefined%',
			textStyle: {}
		},
		markPoint: {
			label: {
				color: '#f2f2f2'
			},
			emphasis: {
				label: {
					color: '#f2f2f2'
				}
			}
		}
	};
};

export const evidenceThemeLight = createTheme('light');
export const evidenceThemeDark = createTheme('dark');
