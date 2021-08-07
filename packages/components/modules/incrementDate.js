function isLeapYear(year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
}

function getDaysInMonth(year, month) {
    return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

function addMonths(date, value) {
    var n = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + value);
    date.setDate(Math.min(n, getDaysInMonth(date.getFullYear(), date.getMonth())));
    return date;
}

export default function incrementDate(date, interval, change) {

    let tempDate = new Date(date);
  
    switch(interval) {
        case "date":
            tempDate.setDate(tempDate.getDate() + (change));
            break;
        case "week":
            tempDate.setDate(tempDate.getDate() + (change * 7));
            break;
        case "month":
            tempDate.setDate(tempDate.getDate() + (change * 15));
            // addMonths(tempDate, change);
            break;
        case "qtr":
            tempDate.setDate(tempDate.getDate() + (change * 45));
            // addMonths(tempDate, change * 3);
            break;
        case "year":
            tempDate.setFullYear(tempDate.getFullYear() + (change));
            break;
        default:
            tempDate.setDate(v.getDate() + (change));
   }
   return tempDate;
  }