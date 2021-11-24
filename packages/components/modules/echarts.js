import * as echarts from 'echarts';
import {colours} from './colours'


export default(node, option, renderer) => {

	echarts.registerTheme('evidence-light', {
        "grid": {
            "left": "0%",
            "right": "4%",
            "bottom": "0%",
            "top": "15%",
            "containLabel": true,
        },
        "color": [
            "#236BA5",
            "#45A0BF",
            "#A5CEEE",
            "#89ADC3",
            "#85C7C6",
            "#D2C6AC",
            "#F4B64A",
            "#8F3D56",
            "#71B9F4",
            "#47A686",
            "#47A686",
            // Grey Scale
            '#71777d', '#7e848a', '#8c9196', '#9a9fa3', '#a8acb0', '#b7babd', '#c5c8ca', '#d4d6d7', '#e3e4e5', '#f3f3f3'
        ],
        "backgroundColor": "rgba(255, 255, 255, 0)",
        "textStyle": {},
        "title": {
            "padding": 0,
            "itemGap": 7,
            "textStyle": {
                "fontSize": 14,
                "color": colours.grey700
            },
            "subtextStyle": {
                "fontSize": 13,
                "color": colours.grey600,
                "overflow": "break"
            },
            "top": '0%'
        },
        "line": {
            "itemStyle": {
                "borderWidth": 0
            },
            "lineStyle": {
                "width": 2,
                "join": 'round'
            },
            "symbolSize": 0,
            "symbol": "circle",
            "smooth": false
        },
        "radar": {
            "itemStyle": {
                "borderWidth": 0
            },
            "lineStyle": {
                "width": 2
            },
            "symbolSize": 0,
            "symbol": "circle",
            "smooth": false
        },
        "bar": {
            "itemStyle": {
                "barBorderWidth": 1,
                "barBorderColor": "#cccccc"
            },
        },
        "pie": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "scatter": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "boxplot": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "parallel": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "sankey": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "funnel": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "gauge": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            }
        },
        "candlestick": {
            "itemStyle": {
                "color": "#eb5454",
                "color0": "#47b262",
                "borderColor": "#eb5454",
                "borderColor0": "#47b262",
                "borderWidth": 1
            }
        },
        "graph": {
            "itemStyle": {
                "borderWidth": 0,
                "borderColor": "#cccccc"
            },
            "lineStyle": {
                "width": 1,
                "color": "#aaaaaa"
            },
            "symbolSize": 0,
            "symbol": "circle",
            "smooth": false,
            "color": [
                "#923d59",
                "#488f96",
                "#518eca",
                "#b3a9a0",
                "#ffc857",
                "#495867",
                "#bfdbf7",
                "#bc4749",
                "#eeebd0"
            ],
            "label": {
                "color": "#f2f2f2"
            }
        },
        "map": {
            "itemStyle": {
                "areaColor": "#eee",
                "borderColor": "#444",
                "borderWidth": 0.5
            },
            "label": {
                "color": "#000"
            },
            "emphasis": {
                "itemStyle": {
                    "areaColor": "rgba(255,215,0,0.8)",
                    "borderColor": "#444",
                    "borderWidth": 1
                },
                "label": {
                    "color": "rgb(100,0,0)"
                }
            }
        },
        "geo": {
            "itemStyle": {
                "areaColor": "#eee",
                "borderColor": "#444",
                "borderWidth": 0.5
            },
            "label": {
                "color": "#000"
            },
            "emphasis": {
                "itemStyle": {
                    "areaColor": "rgba(255,215,0,0.8)",
                    "borderColor": "#444",
                    "borderWidth": 1
                },
                "label": {
                    "color": "rgb(100,0,0)"
                }
            }
        },
        "categoryAxis": {
            "axisLine": {
                "show": true,
                "lineStyle": {
                    "color": colours.grey500
                }
			            },
            "axisTick": {
                "show": false,
                "lineStyle": {
                    "color": "#6E7079"
                },
                "length": 3,
                "alignWithLabel": true
            },
            "axisLabel": {
                "show": true,
                "color": "#6E7079"
            },
            "splitLine": {
                "show": false,
                "lineStyle": {
                    "color": [
                        "#E0E6F1"
                    ]
                }
            },
            "splitArea": {
                "show": false,
                "areaStyle": {
                    "color": [
                        "rgba(250,250,250,0.2)",
                        "rgba(210,219,238,0.2)"
                    ]
                }
            }
        },
        "valueAxis": {
            "axisLine": {
                "show": false,
                "lineStyle": {
                    "color": colours.grey500
                }
            },
            "axisTick": {
                "show": false,
                "lineStyle": {
                    "color": "#6E7079"
                },
                "length": 2
            },
            "axisLabel": {
                "show": true,
                "color": colours.grey500
            },
            "splitLine": {
                "show": true,
                "lineStyle": {
                    "color": [
                        // "#E0E6F1"
                        colours.grey200
                        // '#ebf4fa'
                        // '#f0f1f2'
                    ],
					"width": 1
                }
            },
            "splitArea": {
                "show": false,
                "areaStyle": {
                    "color": [
                        "rgba(250,250,250,0.2)",
                        "rgba(210,219,238,0.2)"
                    ]
                }
            }
        },
        "logAxis": {
            "axisLine": {
                "show": false,
                "lineStyle": {
                    "color": "#6E7079"
                }
            },
            "axisTick": {
                "show": false,
                "lineStyle": {
                    "color": "#6E7079"
                },
                "length": 2
            },
            "axisLabel": {
                "show": true,
                "color": "#6E7079"
            },
            "splitLine": {
                "show": true,
                "lineStyle": {
                    "color": [
                        // "#E0E6F1"
                        // '#ebf2f7'
                        '#ebf4fa'
                    ]
                }
            },
            "splitArea": {
                "show": false,
                "areaStyle": {
                    "color": [
                        "rgba(250,250,250,0.2)",
                        "rgba(210,219,238,0.2)"
                    ]
                }
            }
        },
        "timeAxis": {
            "axisLine": {
                "show": true,
                "lineStyle": {
                    "color": colours.grey400
                }
            },
            "axisTick": {
                "show": true,
                "lineStyle": {
                    "color": "#6E7079"
                },
                "length": 3
            },
            "axisLabel": {
                "show": true,
                "color": "#6E7079"
            },
            "splitLine": {
                "show": false,
                "lineStyle": {
                    "color": [
                        "#E0E6F1"
                    ]
                }
            },
            "splitArea": {
                "show": false,
                "areaStyle": {
                    "color": [
                        "rgba(250,250,250,0.2)",
                        "rgba(210,219,238,0.2)"
                    ]
                }
            }
        },
        "toolbox": {
            "iconStyle": {
                "borderColor": "#999999"
            },
            "emphasis": {
                "iconStyle": {
                    "borderColor": "#459cde"
                }
            }
        },
        "legend": {
            "textStyle": {
                "padding": [0,0,0,-7],
                "color": "#6E7079"
            },
            // "padding": [15,0,0,0],
            "icon": "circle",
            "pageIcons": {
                "horizontal": ['M 17 3 h 2 c 0.386 0 0.738 0.223 0.904 0.572 s 0.115 0.762 -0.13 1.062 L 11.292 15 l 8.482 10.367 c 0.245 0.299 0.295 0.712 0.13 1.062 S 19.386 27 19 27 h -2 c -0.3 0 -0.584 -0.135 -0.774 -0.367 l -9 -11 c -0.301 -0.369 -0.301 -0.898 0 -1.267 l 9 -11 C 16.416 3.135 16.7 3 17 3 Z', 
                'M 12 27 h -2 c -0.386 0 -0.738 -0.223 -0.904 -0.572 s -0.115 -0.762 0.13 -1.062 L 17.708 15 L 9.226 4.633 c -0.245 -0.299 -0.295 -0.712 -0.13 -1.062 S 9.614 3 10 3 h 2 c 0.3 0 0.584 0.135 0.774 0.367 l 9 11 c 0.301 0.369 0.301 0.898 0 1.267 l -9 11 C 12.584 26.865 12.3 27 12 27 Z']
            },
            "pageIconColor": "grey",
            "pageIconSize": 15,
            "pageTextStyle": {
                "color": "grey",
            },
            "pageButtonItemGap": -2,
            "animationDurationUpdate": 300
        },
        "tooltip": {
            "axisPointer": {
                "lineStyle": {
                    "color": "#cccccc",
                    "width": 1
                },
                "crossStyle": {
                    "color": "#cccccc",
                    "width": 1
                }
            }
        },
        "timeline": {
            "lineStyle": {
                "color": "#e3e3e3",
                "width": 2
            },
            "itemStyle": {
                "color": "#d6d6d6",
                "borderWidth": 1
            },
            "controlStyle": {
                "color": "#bfbfbf",
                "borderColor": "#bfbfbf",
                "borderWidth": 1
            },
            "checkpointStyle": {
                "color": "#8f8f8f",
                "borderColor": "#ffffff"
            },
            "label": {
                "color": "#c9c9c9"
            },
            "emphasis": {
                "itemStyle": {
                    "color": "#9c9c9c"
                },
                "controlStyle": {
                    "color": "#bfbfbf",
                    "borderColor": "#bfbfbf",
                    "borderWidth": 1
                },
                "label": {
                    "color": "#c9c9c9"
                }
            }
        },
        "visualMap": {
            "color": [
                "#c41621",
                "#e39588",
                "#f5ed98"
            ]
        },
        "dataZoom": {
            "handleSize": "undefined%",
            "textStyle": {}
        },
        "markPoint": {
            "label": {
                "color": "#f2f2f2"
            },
            "emphasis": {
                "label": {
                    "color": "#f2f2f2"
                }
            }
        }
    });

    const chart = echarts.init(node, 'evidence-light', {renderer: 'svg'});   

	chart.setOption(option);

    window.addEventListener("resize", () => { chart.resize();});

	return {
		// update(option){
		// 	chart.update(option, true, true);
		// },
		destroy() {
			chart.dispose();
		}
	};
}


