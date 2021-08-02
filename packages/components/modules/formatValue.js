
import * as d3 from 'd3';

export default function(value, columnFormat, columnUnits) {

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

    // Get format tag from end of column name (if supplied):
    let fmt = columnFormat;
    switch(fmt){
        case "pct": 
            value = value.toLocaleString(undefined, { style: 'percent' })
            break;
        case "usd": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
            break;
        case "cad": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
            break;
        case "eur": 
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
            break;
        case "gbp":
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
            break;
        case "chf":
            value = value.toLocaleString('en-US',{style: 'currency', currency: 'CHF', minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
            break;
        case "date": 
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "week": 
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "month": 
            value = d3.timeFormat("%b")(value);
            break;
        case "qtr": 
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "year": 
            value = d3.format(".0f")(value.getFullYear());
            break;
        // case "time":
        //     value = value.toLocaleTimeString('en-US')
        //     break;
        case "year_num":
            value = d3.format(".0f")(value)
            break;
        case "id":
            value = d3.format(".0f")(value)
            break;
        default: 
            value = value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + suffix
    }

    return value;
}
  
