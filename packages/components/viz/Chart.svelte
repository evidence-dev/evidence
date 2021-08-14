<script>
    // ---------------------------------------------------------------------------------------
    // Imports
    // ---------------------------------------------------------------------------------------
        import { LayerCake, Svg, Html, Canvas, uniques } from "layercake";
        import {
            scaleTime,
            scaleBand,
            scaleLinear,
        } from "d3-scale";
        import {
            tidy,
            arrange,
            desc,
            asc,
            fixedOrder,
            replaceNully,
            mutate,
            rename
        } from "@tidyjs/tidy";
        import * as d3 from 'd3';
        import { getContext, setContext } from "svelte";
        import getDistinctValues from "../modules/getDistinctValues.js";
        import getParsedDate from "../modules/getParsedDate.js";
        import getDistinctCount from "../modules/getDistinctCount.js";
        import getStackedData from "../modules/getStackedData.js";
        import getStackedExtents from "../modules/getStackedExtents.js";
        import getColumnType from "../modules/getColumnType.js";  
        import getColumnFormat from "../modules/getColumnFormat.js";
        import getColumnExtents from "../modules/getColumnExtents.js";
        import getColumnUnits from "../modules/getColumnUnits.js";
        import countDates from "../modules/countDates.js"
        import getFormatTag from "../modules/getFormatTag.js";
        import incrementDate from "../modules/incrementDate.js";
    
    // ---------------------------------------------------------------------------------------
    // Get data and input props
    // ---------------------------------------------------------------------------------------
        // Chart Container Sizing:
        export let width = "100%";
        export let height = 150;
        export let heightMultiplier = undefined;
        export let marginTop = "2em";
        export let marginBottom = "3.5em";
        export let paddingRight = 20;
        export let paddingLeft = 30;
        export let paddingTop = 0;
        export let paddingBottom = 0;
    
        // Data:
        export let data;
        export let x;
        export let y;
        export let reverseAxes = false;
    
        // Data Types:
        export let xType = undefined;
        export let yType = undefined;
        export let groupType = undefined;
    
        // Value Bounds:
        export let yMin = null;
        export let yMax = null;
        export let xMin = null;
        export let xMax = null;
    
        // Sorting:
        export let sort = undefined;
        export let sortBy = undefined;
        export let sortOrder = undefined;
    
    // ---------------------------------------------------------------------------------------
    // Set up chart area
    // ---------------------------------------------------------------------------------------
        // A chart may have a dataset with too many rows to adequately display. The 
        // heightMultiplier extends the chart height to display all the data:
        height = heightMultiplier ? (height * heightMultiplier) : height; 
    
        // height is a CSS property and needs to be in pixels:
        height = height + "px";
    
    
    // ---------------------------------------------------------------------------------------
    // CLEAN: check types, clean data, prep for charting
    // ---------------------------------------------------------------------------------------
        let xFmtTag = getFormatTag(x);
        let yFmtTag = getFormatTag(y);
        
        let xColType = getColumnType(data, x, xFmtTag);
        let yColType = getColumnType(data, y, yFmtTag);
        
        // Parse dates from date string columns:
        if (xColType === "date") {
            data = getParsedDate(data, x);
        } 
    
        if (yColType === "date") {
            data = getParsedDate(data, y);
        } 

        xType = xType ? xType : xColType === "string" ? "categorical" : xColType === "date" ? "date" : "numerical";
        yType = yType ? yType : yColType === "string" ? "categorical" : yColType === "date" ? "date" :"numerical";
    
        // Column Formats:
        let xFormat = getColumnFormat(xFmtTag, xColType);
        let yFormat = getColumnFormat(yFmtTag, yColType); 

        // Extents:
        let xExtents = getColumnExtents(data, x);
        let yExtents = getColumnExtents(data, y);
        
        if (groupType === "stacked") {
            if (reverseAxes === true && xMax === null) {
                xExtents = getStackedExtents(data, y, x, yColType);
            } else if (reverseAxes === false && yMax === null) {
                yExtents = getStackedExtents(data, x, y, xColType);
            }
        }

        // Padded Extents:
        let xPaddedExtent; 
        if(xType === "date"){
            xPaddedExtent = 
            [
                incrementDate(xExtents[0], xFormat, -1),
                incrementDate(xExtents[1], xFormat, 1)
            ];
        } else if(xType === "numerical") {
            xPaddedExtent = 
            [
                xExtents[0]-((xExtents[1] - xExtents[0])*0.07), 
                xExtents[1]+((xExtents[1] - xExtents[0])*0.07)
            ]
        }

        let yPaddedExtent; 
        if(yType === "date"){
            yPaddedExtent = 
            [
                incrementDate(yExtents[0], yFormat, -1),
                incrementDate(yExtents[1], yFormat, 1)
            ];
        } else if(yType === "numerical") {
            yPaddedExtent = 
            [
                yExtents[0]-((yExtents[1] - yExtents[0])*0.07), 
                yExtents[1]+((yExtents[1] - yExtents[0])*0.07)
            ]
        }

        // Units:
        let xUnits;
        let yUnits;
        let noUnits = [
            "year_num",
            "str",
            "id"
        ]
        if(xType === "numerical" && !noUnits.includes(xFormat)){
            xUnits = getColumnUnits(xExtents);
        }
        if(yType === "numerical" && !noUnits.includes(yFormat)){
            yUnits = getColumnUnits(yExtents);
        }
   

        // Integer Range (if needed for column or bar charts):
        // ON HOLD
        let xIntegerRange;
        if(xColType === "date"){
            xIntegerRange = countDates(xExtents[0], xExtents[1], xFormat);
        } else if(xColType === "number"){
            xIntegerRange = xExtents[1] - xExtents[0] + 1;
        }

        let yIntegerRange;
        if(yFormat === "date" || yFormat === "week" || yFormat === "month" || yFormat === "qtr"){
            yIntegerRange = countDates(yExtents[0], yExtents[1], yFormat);
        } else if(yColType === "number"){
            yIntegerRange = yExtents[1] - yExtents[0] + 1;
        }
    

        // Replace nulls with 0 in number columns
        // and with "" in string columns:
        if (xColType === "number"){
            data = tidy(
                data,
                mutate({ tempName: (d) => d[x]}),
                replaceNully({tempName: 0}),
                rename({tempName: x})
            )
        } else if (xColType === "string"){
            data = tidy(
                data,
                mutate({ tempName: (d) => d[x]}),
                replaceNully({tempName: "Ø"}),
                rename({tempName: x})
            )
        }
    
    
        if (yColType === "number"){
            data = tidy(
                data,
                mutate({ tempName: (d) => d[y]}),
                replaceNully({tempName: 0}),
                rename({tempName: y})
            )
        } else if (yColType === "string"){
            data = tidy(
                data,
                mutate({ tempName: (d) => d[y]}),
                replaceNully({tempName: "Ø"}),
                rename({tempName: y})
            )
        }
    
    
        // Stacked: get stacked dataset
        let stackedData = null;
        if(groupType === "stacked"){
            stackedData = reverseAxes ? 
            getStackedData(data, y, x)
            : getStackedData(data, x, y);
        }
        
    // ---------------------------------------------------------------------------------------
    // SORT: rearrange the data to be correct for whatever we're using it for
    // ---------------------------------------------------------------------------------------
      
        if(sort === "true"){
            if(reverseAxes === false){
                if(xColType === "number" || xColType === "date"){
                    sortBy = x
                    sortOrder = "asc"
                } else {
                    sortBy = y
                    sortOrder = "desc"
                }
            } else {
                if(yColType === "number" || yColType === "date"){
                    sortBy = y
                    sortOrder = "asc"
                } else {
                    sortBy = x
                    sortOrder = "asc"
                } 
            }
    
    
            let sortedVals = [];
            if(groupType === "stacked"){
                if(sortOrder === "asc"){
                    stackedData = tidy(
                        stackedData,
                        arrange(asc(sortBy))
                    )
                } else if(sortOrder === "desc"){
                    stackedData = tidy(
                        stackedData,
                        arrange(desc(sortBy))
                    )
                }
                sortedVals = getDistinctValues(stackedData, reverseAxes ? y : x);
                data = tidy(
                    data,
                    arrange([fixedOrder(reverseAxes ? y : x, sortedVals)])
                )
            } else {
                if(sortOrder === "asc"){
                    data = tidy(
                        data,
                        arrange(asc(sortBy))
                    )
                } else if(sortOrder === "desc"){
                    data = tidy(
                        data,
                        arrange(desc(sortBy))
                    )
                }
            }
        }
      
        
    
    // ---------------------------------------------------------------------------------------
    // DOMAIN: set domain min and max for x and y
    // ---------------------------------------------------------------------------------------
        // Handle Stacked Data:
            
        // If we are displaying stacked data, we need to adjust the axis maximums to allow us to see
        // all the stacked data. We do this by summing all the values and grouping by the categories
        // used in the chart (in a column chart, y is the values and x is the categories; in a bar
        // chart, it is reversed). We then take the maximum value from that summarized dataset and
        // use it as the max of the value axis.
    
        // For example, if we have 2 series (let's call them A and B): A = 100 and B = 100
        // In a normal column chart, the yMax value would be 100. With the math
        // below, it will set it to 200, allowing room for the series to stack.
    
        // The stacked code below only runs if you have not already overridden the max value of the
        // value axis.
     
        let xDomainVals = null;
        if(xType === "categorical") {
            if(groupType === "stacked" && reverseAxes === false) {
                xDomainVals = getDistinctValues(stackedData, x);
            } else {
                xDomainVals = getDistinctValues(data, x);
            }
        } else {
            xDomainVals = [xMin ?? xPaddedExtent[0], xMax ?? xPaddedExtent[1]];
        }
    
        let yDomainVals = null;
        if(yType === "categorical") {
            if(groupType === "stacked" && reverseAxes === true) {
                yDomainVals = getDistinctValues(stackedData, y);
            } else {
                yDomainVals = getDistinctValues(data, y);
            }
        } else {
            yDomainVals = [yMin ?? yPaddedExtent[0], yMax ?? yPaddedExtent[1]];
        }
    
    
    // ---------------------------------------------------------------------------------------
    // SCALE: choose scale type for x and y (map domain values to chart area coordinates)
    // ---------------------------------------------------------------------------------------
        let xScale;
        if (xType === "categorical") {
            xScale = scaleBand().paddingInner([0.35]).padding(0).round(false);
        } else if (xColType === "date") {
            xScale = scaleTime();
        } else if (xColType === "number") {
            xScale = scaleLinear();
        } else {
            xScale = scaleBand();
        }
    
        let yScale;
        if (yType === "categorical") {
            yScale = scaleBand().paddingInner([0.25]).round(false);
        } else if (yColType === "date") {
            yScale = scaleTime();
        } else if (yColType === "number") {
            yScale = scaleLinear();
        } else {
            yScale = scaleBand();
        }
    
    // ---------------------------------------------------------------------------------------
    // SET CONTEXT: Make variable accessible to children of <Chart>
    // ---------------------------------------------------------------------------------------
        setContext("xName", x);
        setContext("yName", y);
    
        setContext("xColType", xColType);
        setContext("yColType", yColType);
    
        setContext("xExtents", xExtents);
        setContext("yExtents", yExtents);

        setContext("xPaddedExtent", xPaddedExtent);
    
        setContext("xFormat", xFormat);
        setContext("yFormat", yFormat);

        setContext("xUnits", xUnits);
        setContext("yUnits", yUnits);
    
        setContext("xIntegerRange", xIntegerRange);
        setContext("yIntegerRange", yIntegerRange);

        setContext("reverseAxes", reverseAxes);

        // Get count of distinct x values (used for setting ticks on x axis):
        var xDistinctCount = getDistinctCount(data, x);
        setContext("xDistinctCount", xDistinctCount);
    
    // ---------------------------------------------------------------------------------------
    </script>

    <div
        class="chart-container {data}"
        style="
            width: {width};
            height: {height};
            margin-bottom: {marginBottom};
            margin-top: {marginTop};
        "
    >
        <LayerCake
            padding={{ right: paddingRight, bottom: paddingBottom, top: paddingTop, left: paddingLeft }}
            x={x}
            y={y}
            data={data}
            xScale={xScale}
            yScale={yScale}
            xDomain={xDomainVals}
            yDomain={yDomainVals}
        >
            <Svg>
                <slot />
            </Svg>
        </LayerCake>
    </div>