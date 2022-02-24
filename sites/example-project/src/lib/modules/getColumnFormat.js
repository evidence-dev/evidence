export default function getColumnFormat(fmtTag, columnType) {

    let dateFmts = [
        "date",
        "week",
        "month",
        "qtr",
        "year"]
    let numFmts = [
        "usd",
        "cad",
        "eur",
        "gbp",
        "chf",
        "str",
        "id",
        "pct",
        "num",
        "num2"]
    let colFmt;
    if(columnType === "date" && dateFmts.includes(fmtTag)){
        colFmt = fmtTag;
    } else if(columnType === "number" && numFmts.includes(fmtTag)){
        colFmt = fmtTag;
    } else if(columnType === "number" && fmtTag === "year") {
        colFmt = "year_num";
    } else {
        colFmt = columnType;
    }

    colFmt = colFmt.replace("string", "str");
    colFmt = colFmt.replace("number", "num");
    return colFmt;
}