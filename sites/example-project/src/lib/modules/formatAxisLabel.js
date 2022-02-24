export default function formatAxisLabel(value, columnFormat, columnUnits) {

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
            if(typeof value === "string"){
                value = new Date(value);
            }
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "week": 
            if(typeof value === "string"){
                value = new Date(value);
            }
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "month": 
            if(typeof value === "string"){
                value = new Date(value);
            }
            value = value.toLocaleString('en-US', {month: 'short'});
            break;
        case "qtr": 
            if(typeof value === "string"){
                value = new Date(value);
            }
            value = value.toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })
            break;
        case "year": 
            if(typeof value === "string"){
                value = new Date(value);
            }
            value = value.getFullYear();
            break;
        case "year_num":
            value = value;
            break;
        default: 
            value = value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix
    }

  return value;
	
}
