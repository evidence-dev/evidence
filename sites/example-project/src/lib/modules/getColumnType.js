function checkDataType(data, column){
    let dataType;
    data = data.filter(d => d[column] != null);
    dataType = typeof data[0][column];
    return dataType;
}

export default function getColumnType(data, column, fmtTag) {
    // Takes query result and column to check type
    // Checks first non-null row to determine type (string or number)
    // If string and _date tag supplied in SQL column name, treat as date
    // Outputs string, number, or date as column types

    // Get original data type:
    let colType = checkDataType(data, column);
    let dateFmts = [
        "date", 
        "week",
        "month",
        "qtr",
        "year"
    ];

    let assignedType;
    let testDateStr;
    let testDate;
    let numCheck;
    if(colType === "string" && dateFmts.includes(fmtTag)){
            testDateStr = data[0][column];    

            if(testDateStr.includes("-")){
                if(!testDateStr.includes(":")){
                    testDateStr = testDateStr + "T00:00";
                }
                testDate = new Date(testDateStr);
                // If successful, Date will print date starting with a number
                // If it failed, it will still create a date object, but with
                // a string message (typically 'Invalid Date', but may vary
                // based on implementation)
                numCheck = Number.parseInt(testDate.toLocaleString().substr(0,1));
                if(!isNaN(numCheck) && numCheck != null){
                    assignedType = "date";
                } else {
                    assignedType = "string";
                }    
            } else {
                assignedType = colType;
            }
    } else {
        assignedType = colType;
    }
    return assignedType;
}
