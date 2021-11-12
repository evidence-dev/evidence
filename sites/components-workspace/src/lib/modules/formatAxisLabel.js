import * as d3 from 'd3';

export default function formatAxisLabel(value, columnFormat, columnUnits) {

    var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%b %e"),
    formatWeek = d3.timeFormat("%b %e"),
    formatMonth = d3.timeFormat("%b"),
    formatYear = d3.timeFormat("%Y");

    let suffix;
    switch(columnUnits){
          case "B":
              value = value / 1000000000; // 1,000,000,000
              suffix = columnUnits;
              break;
          case "M":
              value = value / 1000000; // 1,000,000
              suffix = columnUnits;
              break;
          case "k":
              value = value / 1000; // 1,000
              suffix = columnUnits;
              break;
          default:
              value = value;
              suffix = '';
    }

    switch(columnFormat){
        case "pct": 
            value = value.toLocaleString(undefined, { style: 'percent' })
            break;
        case "usd": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
            break;
        case "cad": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
            break;
        case "eur": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
            break;
        case "gbp": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
            break;
        case "chf": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
            break;
        case "date": 
            value = (d3.timeSecond(value) < value ? formatMillisecond
            : d3.timeMinute(value) < value ? formatSecond
            : d3.timeHour(value) < value ? formatMinute
            : d3.timeDay(value) < value ? formatHour
            : d3.timeMonth(value) < value ? (d3.timeWeek(value) < value ? formatDay : formatWeek)
            : d3.timeYear(value) < value ? formatMonth
            : formatYear)(value);
            break;
        case "month": 
            value = (d3.timeSecond(value) < value ? formatMillisecond
            : d3.timeMinute(value) < value ? formatSecond
            : d3.timeHour(value) < value ? formatMinute
            : d3.timeDay(value) < value ? formatHour
            : d3.timeMonth(value) < value ? (d3.timeWeek(value) < value ? formatDay : formatWeek)
            : d3.timeYear(value) < value ? formatMonth
            : formatYear)(value);
            break;
        case "week":
            value = formatWeek(value);
            break;
        case "qtr":
            value = (d3.timeSecond(value) < value ? formatMillisecond
            : d3.timeMinute(value) < value ? formatSecond
            : d3.timeHour(value) < value ? formatMinute
            : d3.timeDay(value) < value ? formatHour
            : d3.timeMonth(value) < value ? (d3.timeWeek(value) < value ? formatDay : formatWeek)
            : d3.timeYear(value) < value ? formatMonth
            : formatYear)(value);
            break;
        case "year":
            value = (d3.timeSecond(value) < value ? formatMillisecond
            : d3.timeMinute(value) < value ? formatSecond
            : d3.timeHour(value) < value ? formatMinute
            : d3.timeDay(value) < value ? formatHour
            : d3.timeMonth(value) < value ? (d3.timeWeek(value) < value ? formatDay : formatWeek)
            : d3.timeYear(value) < value ? formatMonth
            : formatYear)(value);
            break;
        case "year_num":
            value = d3.format(".0f")(value)
            break;
        default: 
            value = value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
    }

  return value;
	
}
