import {tidy, groupBy, sum, mutateWithSummary, mutate, rate, rename} from "@tidyjs/tidy";

export default function getStackPercentages(data, groupCol, valueCol){

    let vc = valueCol;
    let pctData = tidy(
        data,
        groupBy(groupCol, mutateWithSummary({xTotal: sum(valueCol)})),
        mutate({ percentOfX: rate(valueCol, 'xTotal')}),
        rename(
            {
                [valueCol]: valueCol + "_raw",
                percentOfX: valueCol + "_pct"
            })
    )

    return pctData

}
