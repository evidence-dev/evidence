function countDays(dateFrom, dateTo){
    const diffTime = Math.abs(dateTo - dateFrom) + 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

function countMonths(dateFrom, dateTo) {
    return dateTo.getMonth() - dateFrom.getMonth() + 1 + 
    (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
}

function countYears(dateFrom, dateTo) {
    return Math.abs(dateTo.getFullYear() - dateFrom.getFullYear() + 1);
}

function countQuarters(dateFrom, dateTo) {
    // Add 1 to getMonth function to make output 1-based:
    const month1 = dateFrom.getMonth() + 1;
    const month2 = dateTo.getMonth() + 1;
    const qtr1 = Math.ceil(month1/3);
    const qtr2 = Math.ceil(month2/3);
    const qtrDiff = Math.abs(qtr2 - qtr1);
    const year1 = dateFrom.getFullYear();
    const year2 = dateTo.getFullYear();
    const qtrCount = qtrDiff + 1 + (4 * Math.abs(year2-year1))
    return qtrCount;
}

function getWeek(date, dowOffset) {
    /**
     * Returns the week number for this date.  dowOffset is the day of week the week
     * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
     * the week returned is the ISO 8601 week number.
     */
     /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    dowOffset = typeof(dowOffset) == 'number' ? dowOffset : 0; //default dowOffset to zero
    var newYear = new Date(date.getFullYear(),0,1);
    var day = newYear.getDay() - dowOffset; //the day of week the year begins on
    day = (day >= 0 ? day : day + 7);
    var daynum = Math.floor((date.getTime() - newYear.getTime() - 
    (date.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
    var weeknum;
    var nYear;
    var nday;
    //if the year starts before the middle of a week
    if(day < 4) {
        weeknum = Math.floor((daynum+day-1)/7) + 1;
        if(weeknum > 52) {
            nYear = new Date(date.getFullYear() + 1,0,1);
            nday = nYear.getDay() - dowOffset;
            nday = nday >= 0 ? nday : nday + 7;
            /*if the next year starts before the middle of
            the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53;
        }
    }
    else {
        weeknum = Math.floor((daynum+day-1)/7);
    }
    return weeknum;
};

function countWeeks(dateFrom, dateTo) {
    return getWeek(dateTo,0) - getWeek(dateFrom,0) + 1 + 
    (52 * (dateTo.getFullYear() - dateFrom.getFullYear()))
}

export default function countDates(dateFrom, dateTo, interval){

        dateFrom = new Date(dateFrom);
        dateTo = new Date(dateTo);

        let dCount;

        switch(interval){
            case "date":
                dCount = countDays(dateFrom, dateTo);
                break;
            case "week":
                dCount = countWeeks(dateFrom, dateTo);
                break;
            case "month":
                dCount = countMonths(dateFrom, dateTo);
                break;
            case "qtr":
                dCount = countQuarters(dateFrom, dateTo);
                break;
            case "year":
                dCount = countYears(dateFrom, dateTo);
                break;
            default:
                dCount = countDays(dateFrom, dateTo);
       }

        return dCount;
    }