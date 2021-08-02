import * as d3 from 'd3';

export default function formatAxisLabel(data, columnFormat, columnUnits, firstTick) {
    var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %e"),
    formatMonth = d3.timeFormat("%b"),
    formatYear = d3.timeFormat("%Y");

    let suffix;
    switch(columnUnits){
          case "B":
              data = data / 1000000000; // 1,000,000,000
              suffix = columnUnits;
              break;
          case "M":
              data = data / 1000000; // 1,000,000
              suffix = columnUnits;
              break;
          case "k":
              data = data / 1000; // 1,000
              suffix = columnUnits;
              break;
          default:
              data = data;
              suffix = '';
    }

    firstTick = firstTick === "firstTick" ? true : false;

    switch(columnFormat){
        case "pct": 
            data = firstTick ? data.toLocaleString(undefined, { style: 'percent' }) : data.toLocaleString();
            break;
        case "usd": 
            data = firstTick ? data.toLocaleString('en-US',{style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString();
            break;
        case "cad": 
            data = firstTick ? data.toLocaleString('en-US',{style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString();
            break;
        case "eur": 
            data = firstTick ? data.toLocaleString('en-US',{style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString();
            break;
        case "gbp": 
            data = firstTick ? data.toLocaleString('en-US',{style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString();
            break;
        case "chf": 
            data = firstTick ? data.toLocaleString('en-US',{style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString();
            break;
        case "date": 
            data = (d3.timeSecond(data) < data ? formatMillisecond
            : d3.timeMinute(data) < data ? formatSecond
            : d3.timeHour(data) < data ? formatMinute
            : d3.timeDay(data) < data ? formatHour
            : d3.timeMonth(data) < data ? (d3.timeWeek(data) < data ? formatDay : formatWeek)
            : d3.timeYear(data) < data ? formatMonth
            : formatYear)(data);
            break;
        case "month": 
            data = (d3.timeSecond(data) < data ? formatMillisecond
            : d3.timeMinute(data) < data ? formatSecond
            : d3.timeHour(data) < data ? formatMinute
            : d3.timeDay(data) < data ? formatHour
            : d3.timeMonth(data) < data ? (d3.timeWeek(data) < data ? formatDay : formatWeek)
            : d3.timeYear(data) < data ? formatMonth
            : formatYear)(data);
            break;
        case "week":
            data = (d3.timeSecond(data) < data ? formatMillisecond
            : d3.timeMinute(data) < data ? formatSecond
            : d3.timeHour(data) < data ? formatMinute
            : d3.timeDay(data) < data ? formatHour
            : d3.timeMonth(data) < data ? (d3.timeWeek(data) < data ? formatDay : formatWeek)
            : d3.timeYear(data) < data ? formatMonth
            : formatYear)(data);
            break;
        case "qtr":
            data = (d3.timeSecond(data) < data ? formatMillisecond
            : d3.timeMinute(data) < data ? formatSecond
            : d3.timeHour(data) < data ? formatMinute
            : d3.timeDay(data) < data ? formatHour
            : d3.timeMonth(data) < data ? (d3.timeWeek(data) < data ? formatDay : formatWeek)
            : d3.timeYear(data) < data ? formatMonth
            : formatYear)(data);
            break;
        case "year":
            data = (d3.timeSecond(data) < data ? formatMillisecond
            : d3.timeMinute(data) < data ? formatSecond
            : d3.timeHour(data) < data ? formatMinute
            : d3.timeDay(data) < data ? formatHour
            : d3.timeMonth(data) < data ? (d3.timeWeek(data) < data ? formatDay : formatWeek)
            : d3.timeYear(data) < data ? formatMonth
            : formatYear)(data);
            break;
        case "year_num":
            data = d3.format(".0f")(data)
            break;
        default: 
            data = firstTick ? data.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix : data.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})
    }

  return data;
	
}
