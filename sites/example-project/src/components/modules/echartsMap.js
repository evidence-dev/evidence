import * as echarts from 'echarts';
import usaMap from './usaMap.json'
// import worldMap from './worldMap.json'

export default(node, option, renderer) => {

    echarts.registerMap('US', usaMap, {
        Alaska: {
        left: -145,
        top: 45,
        width: 15
        },
        Hawaii: {
        left: -140,
        top: 28,
        width: 5
        },
        'Puerto Rico': {
        left: -76,
        top: 26,
        width: 2
        }
    });

    const chart = echarts.init(node, {renderer: 'svg'});   


	chart.setOption(option);


      
    let resizeObserver
    const containerElement = document.querySelector('div.content > article')
    const resizeChart = () => {
        chart.resize({
            animation: {
                duration: 500
            }
        })
    }
    
    if (window.ResizeObserver && containerElement) {
        resizeObserver = new ResizeObserver(resizeChart)
        resizeObserver.observe(containerElement)
    } else {
        window.addEventListener("resize", resizeChart);
    }

    return {
		update(option){
			chart.setOption(option, true, true);
		},
        destroy() {
            if (resizeObserver) {
                resizeObserver.unobserve(containerElement)
            } else {
                window.removeEventListener("resize", resizeChart)
            }
            chart.dispose();
		}
	};
}




  
