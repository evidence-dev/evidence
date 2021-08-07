import {tidy, groupBy, summarize, sum, min, max} from "@tidyjs/tidy";

export default function getStackedExtents(data, groupCol, valueCol) {
    var positiveData = tidy(
            data.filter(d => d[valueCol] > 0),
            groupBy(groupCol, [summarize({ total: sum(valueCol) })])
    );
    var negativeData = tidy(
        data.filter(d => d[valueCol] < 0),
        groupBy(groupCol, [summarize({ total: sum(valueCol) })])
    );

    var maxData = tidy(
        positiveData,
        summarize({ value: max("total") })
    );

    var minData = tidy(
        negativeData,
        summarize({ value: min("total") })
    );

    var extents = [minData[0].value == undefined ? 0 : minData[0].value, maxData[0].value == undefined ? 0 : maxData[0].value];
    
    return extents;
} 