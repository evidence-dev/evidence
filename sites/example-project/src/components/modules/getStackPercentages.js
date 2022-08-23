import {tidy, groupBy, sum, mutateWithSummary, mutate, rate} from "@tidyjs/tidy";

export default function getStackPercentages(data, groupCol, valueCol){

    let pctData = tidy(
        data,
        groupBy(groupCol, mutateWithSummary({xTotal: sum(valueCol)})),
        mutate({ percentOfX_pct: rate(valueCol, 'xTotal')})
    )

    // should set name of percent column to be same as y column. Can achieve with tidy's rename function if needed
    return pctData

}
