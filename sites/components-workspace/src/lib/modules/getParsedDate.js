import {tidy, mutate} from "@tidyjs/tidy";

export default function getParsedDate(data, column) {
    
    let append = '';
    // if the date string does not include a timestamp,
    // append midnight:
    if(!data[0][column].includes(":")){
        append = "T00:00"
    }

    data = tidy(
        data,
        mutate({ [column]: (d) => new Date(d[column]+append)}),
    );

    return data;
}