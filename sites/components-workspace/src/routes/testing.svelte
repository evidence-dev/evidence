<script>

import AreaChart from '$lib/viz/AreaChart.svelte'
import BarChart from '$lib/viz/BarChart.svelte'
import LineChart from '$lib/viz/LineChart.svelte'
import BubbleChart from '$lib/viz/BubbleChart.svelte'

import {tidy, complete, fullSeq} from "@tidyjs/tidy";

import Line from '$lib/viz/Line.svelte'
    import Bar from '$lib/viz/Bar.svelte'
    import Scatter from '$lib/viz/Scatter.svelte'
    import Bubble from '$lib/viz/Bubble.svelte'
    import Area from '$lib/viz/Area.svelte'

    import Chart from '$lib/viz/Chart.svelte'


let newd = [
    {x: 1.5, y: 100, y2: 200},
    {x: 2, y: 101, y2: 200},
    {x: 4, y: 102, y2: 200},
    {x: 5, y: 103, y2: 200},
    {x: 10, y: 104, y2: 200}
]

let seq = tidy(newd, complete({ x: fullSeq('x', 0.5) }))

let newd2 = [
    {x: 1.5, series: 'a', y: 100, y2: 201},
    {x: 2, series: 'b' , y: 101, y2: 203},
    {x: 4, series: 'a' , y: 102, y2: 205},
    {x: 5, series: 'b' , y: 103, y2: 207},
    {x: 10, series: 'c' , y: 104, y2: 290},
    {x: 1.5, series: 'b', y: 100, y2: 201},
    {x: 2, series: 'a' , y: 101, y2: 203},
    {x: 4, series: 'b' , y: 102, y2: 205},
    {x: 5, series: 'c' , y: 103, y2: 207},
    {x: 10, series: 'a' , y: 104, y2: 290}
]

function findMinDiff(arr, n)
    {
        // Sort array in
        // non-decreasing order
        arr.sort(function(a, b)
        {return a - b});
          
        // Initialize difference
        // as infinite
        let diff = Number.MAX_VALUE;
          
        // Find the min diff by
        // comparing adjacent pairs
        // in sorted array
        for (let i = 0; i < n - 1; i++)
            if (arr[i + 1] - arr[i] < diff)
                diff = arr[i + 1] - arr[i];
          
        // Return min diff
        return diff;
    }

let x2 = 'x';
let series2 = 'series';
let y2 = ['y','y2']

let seq2 = tidy(
    newd2, 
    complete(
        {[x2]: fullSeq(x2, 0.5), 
            [series2]: series2}))

let testData = [
    {xa: 1, seriesa: "A", value: 110, value2: 200},
    {xa: 2, seriesa: "A", value: 120, value2: 220},
    {xa: 3, seriesa: "A", value: 130, value2: 230},
    {xa: 1, seriesa: "B", value: 210, value2: 240},
    {xa: 3, seriesa: "B", value: 230, value2: 210}
]
let x="xa"
let series="seriesa"
let y = "value"
let newData = tidy(testData, complete([x, series]))

       let banks = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1}
]

let banksFilled = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2015-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: null},
    
    {fed_reserve_district: 'NY', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'SF', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2016-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: null},

    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'KC', established_date: '2017-01-01', banks: null},
    {fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: null},
    {fed_reserve_district: 'NY', established_date: '2017-01-01', banks: null},

    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: null},
    {fed_reserve_district: 'KC', established_date: '2018-01-01', banks: null},

    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'KC', established_date: '2019-01-01', banks: null},

    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: null},
    {fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: null},

    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2021-01-01', banks: null},
    {fed_reserve_district: 'NY', established_date: '2021-01-01', banks: null}
]

let banksFilledZero = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: 0},
    
    {fed_reserve_district: 'NY', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'SF', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'KC', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2017-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2018-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'KC', established_date: '2019-01-01', banks: 0},

    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2021-01-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2021-01-01', banks: 0}
]


let full = 
[
    {year: '1985-01-01', value: 302},
    {year: '1986-01-01', value: 375},
    {year: '1987-01-01', value: 336},
    {year: '1988-01-01', value: 579},
    {year: '1989-01-01', value: 443},
    {year: '1990-01-01', value: 598},
    {year: '1991-01-01', value: 303},
    {year: '1993-01-01', value: 305},
    {year: '1994-01-01', value: 262},
    {year: '1995-01-01', value: 399},
    {year: '1996-01-01', value: 406}
]

let fed = [
    {fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1},
    {fed_reserve_district: 'SF', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2015-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: 0},
    
    {fed_reserve_district: 'NY', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'SF', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2016-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3},
    {fed_reserve_district: 'KC', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2017-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'SF', established_date: '2018-01-01', banks: 3},
    {fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: 0},
    {fed_reserve_district: 'KC', established_date: '2018-01-01', banks: 0},

    {fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4},
    {fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1},
    {fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2},
    {fed_reserve_district: 'KC', established_date: '2019-01-01', banks: 0},

    {fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4},
    {fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1},
    {fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: 0},
    {fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: 0},

    {fed_reserve_district: 'SF', established_date: '2021-02-01', banks: 2},
    {fed_reserve_district: 'ATL', established_date: '2021-02-01', banks: 3},
    {fed_reserve_district: 'CHI', established_date: '2021-02-01', banks: 3},
    {fed_reserve_district: 'DAL', established_date: '2021-02-01', banks: 1},
    {fed_reserve_district: 'KC', established_date: '2021-02-01', banks: 0},
    {fed_reserve_district: 'NY', established_date: '2021-02-01', banks: 0}
]

let multy = 
[
    {x: "1900", y1: 103, y2: 135, y3: 88},
    {x: "1901", y1: 105, y2: 138, y3: 93},
    {x: "1902", y1: 106, y2: 132, y3: 103},
    {x: "1903", y1: 108, y2: 130, y3: 105},
    {x: "1904", y1: 109, y2: 128, y3: 102},
    {x: "1905", y1: 111, y2: 124, y3: 101},
    {x: "1906", y1: 120, y2: 122, y3: 100},
    {x: "1907", y1: 133, y2: 131, y3: 100},
    {x: "1908", y1: 142, y2: 128, y3: 99},
    {x: "1909", y1: 156, y2: 135, y3: 97},
    {x: "1910", y1: 168, y2: 137, y3: 95}
]

let numberSeriesMissingY = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]

let missingX =
[
    {x: 14, y: 34},
    {x: 15, y: 57},
    {x: 16, y: 26},
    {x: 17, y: 41},
    {x: 18, y: 41},
    {x: 20, y: 32},
    {x: 21, y: 52},
    {x: 22, y: 48},
    {x: 23, y: 52},
    {x: 24, y: 48},
    {x: 25, y: 48}
]

let numberSeriesXSync = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'b', y: 26},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3.1, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]


let dec = [
    {x: 1.134, y: 10},
    {x: 1.234, y: 15},
    {x: 1.334, y: 17},
    {x: 1.434, y: 24},
    {x: 1.634, y: 13},
    {x: 1.734, y: 11},
    {x: 1.834, y: 8},
    {x: 1.934, y: 22},
    {x: 2.000, y: 36},
]

let stackOrd = [
    {x: "TX", series: "Active", y: 50},
    {x: "TX", series: "Inactive", y: 100},
    {x: "NY", series: "Active", y: 80},
    {x: "NY", series: "Inactive", y: 80},
    {x: "KC", series: "Active", y: 40},
    {x: "KC", series: "Inactive", y: 70}
]

</script>

<!-- <Chart data={fed} x=established_date series=fed_reserve_district yBaseline=true yTickMarks=true xTickMarks=true swapXY=true>
    <Line/>
    <Bar/>
    <Area/>
</Chart>

<Chart data={multy} swapXY=true>
    <Bar y=y1/>
    <Area y=y2/>
</Chart>

<Chart data={numberSeriesMissingY} series=series swapXY=true>
    <Area/>
</Chart>


<Chart data={multy} swapXY=true>
    <Bar y={['y1', 'y3']}/>
    <Line y=y2/>
</Chart> -->


<!-- <BarChart data={missingX}  title="Missing X" swapXY=true/> -->

<BarChart data={numberSeriesXSync} series=series title="X out of sync"/>

<BarChart data={dec}/>

<BarChart data={stackOrd} series=series swapXY=true/>

<AreaChart data={fed} x=established_date series=fed_reserve_district/>