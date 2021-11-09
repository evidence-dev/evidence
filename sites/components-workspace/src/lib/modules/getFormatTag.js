export default function getFormatTag(columnName) {

    // Lowercase all characters in name:
    columnName = columnName.toLowerCase();

    // Find last underscore in column name:
    let lastUnderscore = columnName.lastIndexOf("_");
    // returns -1 if there are zero underscores in the name

    let fmt_stub = null;
    if(lastUnderscore !== -1){
        fmt_stub = columnName.substr(lastUnderscore);
    }

    // Remove underscore to get clean format tag:
    let fmt = null;
    if(fmt_stub !== null){
        fmt = fmt_stub.replace("_", "");
    }

    // Filter for supported format tags:

    let supportedTags = [
    // Date/Time:
    "date",
    "week",
    "month",
    "qtr",
    "year",

    // Currency:
    "usd",
    "cad",
    "eur",
    "gbp",
    "chf",

    // Numbers:
    "pct",
    "num",
    "num2",

    // Strings:
    "str",
    "id" // treating IDs as strings even if they are numbers
    ]

    // if the fmt tag OR the full column name is in the supported tags, use that tag:
    fmt = supportedTags.includes(fmt) ? fmt : supportedTags.includes(columnName) ? columnName : null;
    return fmt;
}


