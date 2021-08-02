import {tidy, groupBy, summarize, sum, rename} from "@tidyjs/tidy";

export default function getStackedData(data, groupCol, valueCol) {
    var stackedData = tidy(
            data,
            groupBy(groupCol, [summarize({ total: sum(valueCol) })]),
            rename({total: valueCol})
        );
    return stackedData;
}