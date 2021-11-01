import {tidy, summarize, min, max} from "@tidyjs/tidy";

export default function getExtents(data, column) {
    var domainData = tidy(
        data,
        summarize({ min: min(column), max: max(column) })
    );
    let minValue = domainData[0].min;
    let maxValue = domainData[0].max;
    return [minValue, maxValue];
}