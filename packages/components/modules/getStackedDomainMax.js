import {tidy, groupBy, summarize, sum, max} from "@tidyjs/tidy";

export default function getStackedDomainMax(data, groupCol, valueCol) {
    var summarizedData = tidy(
            data,
            groupBy(groupCol, [summarize({ total: sum(valueCol) })])
        );
    var maxData = tidy(
        summarizedData,
        summarize({ value: max("total") })
    );
    let maxValue = maxData[0].value;
    return maxValue;
}