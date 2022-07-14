import {tidy, groupBy, sum, mutateWithSummary, mutate, rate} from "@tidyjs/tidy";

export default function getStackPercentages(data, groupCol, valueCol){

    let pctData = tidy(
        data,
        groupBy(groupCol, mutateWithSummary({xTotal: sum(valueCol)})),
        mutate({ percentOfX_pct: rate(valueCol, 'xTotal')})
    )

    return pctData

}
