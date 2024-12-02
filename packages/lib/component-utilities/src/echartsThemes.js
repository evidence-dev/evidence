import { chartColours, uiColours } from './colours';

// Light Mode Theme
const light_axisBaselineColor = uiColours.grey500;
const light_axisTickColor = uiColours.grey500;
const light_axisLabelColor = uiColours.grey500;
const light_gridlineColor = uiColours.grey200;
const light_axisTitleBackgroundColor = 'white';
const light_legendTextColor = uiColours.grey500;
const light_legendPageIconColor = uiColours.grey600;
const light_legendPageTextColor = uiColours.grey500;
const light_tooltipBorderColor = uiColours.grey400;
const light_tooltipBackgroundColor = 'white';
const light_tooltipTextColor = uiColours.grey900;
const light_titleColor = uiColours.grey800;
const light_subtitleColor = uiColours.grey700;

// Dark Mode Theme
const dark_axisBaselineColor = uiColours.grey500;
const dark_axisTickColor = uiColours.grey500;
const dark_axisLabelColor = uiColours.grey500;
const dark_gridlineColor = uiColours.grey900;
const dark_axisTitleBackgroundColor = '#212121';
const dark_legendTextColor = uiColours.grey500;
const dark_legendPageIconColor = uiColours.grey500;
const dark_legendPageIconInactiveColor = uiColours.grey900;
const dark_legendPageTextColor = uiColours.grey600;
const dark_legendInactiveColor = uiColours.grey800;
const dark_tooltipBorderColor = uiColours.grey600;
const dark_tooltipBackgroundColor = uiColours.grey900;
const dark_tooltipTextColor = uiColours.grey200;
const dark_titleColor = uiColours.grey400;
const dark_subtitleColor = uiColours.grey400;

export const evidenceThemeLight = {
	darkMode: false, // if true, echarts will automatically update the font colour to work better on dark background
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
	color: chartColours,
	backgroundColor: 'rgba(255, 255, 255, 0)',
	title: {
		padding: 0,
		itemGap: 7,
		textStyle: {
			fontSize: 14,
			color: light_titleColor
		},
		subtextStyle: {
			fontSize: 13,
			color: light_subtitleColor,
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
				color: light_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: light_axisTickColor
			},
			length: 3,
			alignWithLabel: true
		},
		axisLabel: {
			show: true,
			color: light_axisLabelColor
		},
		splitLine: {
			show: false,
			lineStyle: {
				color: [light_gridlineColor]
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
				color: light_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: light_axisTickColor
			},
			length: 2
		},
		axisLabel: {
			show: true,
			color: light_axisLabelColor
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: [light_gridlineColor],
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
			backgroundColor: light_axisTitleBackgroundColor
		}
	},
	logAxis: {
		axisLine: {
			show: false,
			lineStyle: {
				color: light_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: light_axisTickColor
			},
			length: 2
		},
		axisLabel: {
			show: true,
			color: light_axisLabelColor
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: [light_gridlineColor]
			}
		},
		splitArea: {
			show: false,
			areaStyle: {
				color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
			}
		},
		nameTextStyle: {
			backgroundColor: light_axisTitleBackgroundColor
		}
	},
	timeAxis: {
		axisLine: {
			show: true,
			lineStyle: {
				color: light_axisBaselineColor
			}
		},
		axisTick: {
			show: true,
			lineStyle: {
				color: light_axisTickColor
			},
			length: 3
		},
		axisLabel: {
			show: true,
			color: light_axisLabelColor
		},
		splitLine: {
			show: false,
			lineStyle: {
				color: [light_gridlineColor]
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
			color: light_legendTextColor
		},
		// "padding": [15,0,0,0],
		icon: 'circle',
		pageIcons: {
			horizontal: [
				'M 17 3 h 2 c 0.386 0 0.738 0.223 0.904 0.572 s 0.115 0.762 -0.13 1.062 L 11.292 15 l 8.482 10.367 c 0.245 0.299 0.295 0.712 0.13 1.062 S 19.386 27 19 27 h -2 c -0.3 0 -0.584 -0.135 -0.774 -0.367 l -9 -11 c -0.301 -0.369 -0.301 -0.898 0 -1.267 l 9 -11 C 16.416 3.135 16.7 3 17 3 Z',
				'M 12 27 h -2 c -0.386 0 -0.738 -0.223 -0.904 -0.572 s -0.115 -0.762 0.13 -1.062 L 17.708 15 L 9.226 4.633 c -0.245 -0.299 -0.295 -0.712 -0.13 -1.062 S 9.614 3 10 3 h 2 c 0.3 0 0.584 0.135 0.774 0.367 l 9 11 c 0.301 0.369 0.301 0.898 0 1.267 l -9 11 C 12.584 26.865 12.3 27 12 27 Z'
			]
		},
		pageIconColor: light_legendPageIconColor,
		pageIconSize: 12,
		pageTextStyle: {
			color: light_legendPageTextColor
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
		borderColor: light_tooltipBorderColor,
		backgroundColor: light_tooltipBackgroundColor,
		textStyle: {
			color: light_tooltipTextColor,
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

export const evidenceThemeDark = {
	darkMode: true, // if true, echarts will automatically update the font colour to work better on dark background
	textStyle: {
		fontFamily: 'sans-serif'
	},
	grid: {
		left: '0%',
		right: '4%',
		bottom: '0%',
		top: '15%',
		containLabel: true
	},
	color: chartColours,
	backgroundColor: 'rgba(255, 255, 255, 0)',
	title: {
		padding: 0,
		itemGap: 7,
		textStyle: {
			fontSize: 14,
			color: dark_titleColor
		},
		subtextStyle: {
			fontSize: 13,
			color: dark_subtitleColor,
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
	bar: {
		itemStyle: {
			barBorderWidth: 1,
			barBorderColor: '#cccccc'
		}
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
			borderWidth: 0,
			borderColor: '#cccccc'
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
				color: dark_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: dark_axisTickColor
			},
			length: 3,
			alignWithLabel: true
		},
		axisLabel: {
			show: true,
			color: dark_axisLabelColor
		},
		splitLine: {
			show: false,
			lineStyle: {
				color: [dark_gridlineColor]
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
				color: dark_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: dark_axisTickColor
			},
			length: 2
		},
		axisLabel: {
			show: true,
			color: dark_axisLabelColor
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: [dark_gridlineColor],
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
			backgroundColor: dark_axisTitleBackgroundColor
		}
	},
	logAxis: {
		axisLine: {
			show: false,
			lineStyle: {
				color: dark_axisBaselineColor
			}
		},
		axisTick: {
			show: false,
			lineStyle: {
				color: dark_axisTickColor
			},
			length: 2
		},
		axisLabel: {
			show: true,
			color: dark_axisLabelColor
		},
		splitLine: {
			show: true,
			lineStyle: {
				color: [dark_gridlineColor]
			}
		},
		splitArea: {
			show: false,
			areaStyle: {
				color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)']
			}
		},
		nameTextStyle: {
			backgroundColor: dark_axisTitleBackgroundColor
		}
	},
	timeAxis: {
		axisLine: {
			show: true,
			lineStyle: {
				color: dark_axisBaselineColor
			}
		},
		axisTick: {
			show: true,
			lineStyle: {
				color: dark_axisTickColor
			},
			length: 3
		},
		axisLabel: {
			show: true,
			color: dark_axisLabelColor
		},
		splitLine: {
			show: false,
			lineStyle: {
				color: [dark_gridlineColor]
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
			color: dark_legendTextColor
		},
		inactiveColor: dark_legendInactiveColor,
		// "padding": [15,0,0,0],
		icon: 'circle',
		pageIcons: {
			horizontal: [
				'M 17 3 h 2 c 0.386 0 0.738 0.223 0.904 0.572 s 0.115 0.762 -0.13 1.062 L 11.292 15 l 8.482 10.367 c 0.245 0.299 0.295 0.712 0.13 1.062 S 19.386 27 19 27 h -2 c -0.3 0 -0.584 -0.135 -0.774 -0.367 l -9 -11 c -0.301 -0.369 -0.301 -0.898 0 -1.267 l 9 -11 C 16.416 3.135 16.7 3 17 3 Z',
				'M 12 27 h -2 c -0.386 0 -0.738 -0.223 -0.904 -0.572 s -0.115 -0.762 0.13 -1.062 L 17.708 15 L 9.226 4.633 c -0.245 -0.299 -0.295 -0.712 -0.13 -1.062 S 9.614 3 10 3 h 2 c 0.3 0 0.584 0.135 0.774 0.367 l 9 11 c 0.301 0.369 0.301 0.898 0 1.267 l -9 11 C 12.584 26.865 12.3 27 12 27 Z'
			]
		},
		pageIconColor: dark_legendPageIconColor,
		pageIconInactiveColor: dark_legendPageIconInactiveColor,
		pageIconSize: 12,
		pageTextStyle: {
			color: dark_legendPageTextColor
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
		borderColor: dark_tooltipBorderColor,
		backgroundColor: dark_tooltipBackgroundColor,
		textStyle: {
			color: dark_tooltipTextColor,
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
