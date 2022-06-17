import * as ssf from 'ssf';
import { getContext } from 'svelte';

//see https://www.benlcollins.com/spreadsheets/google-sheets-custom-number-format/
//TODO note 0.##% is not ideal as it could show something like 15.% => https://superuser.com/questions/205759/format-a-number-with-optional-decimal-places-in-excel
export const builtInFormats = [
    // Date/Time:
   {formatName: "date", formatValue: "MMM dd, yyyy", valueType: 'date', exampleInput: 'Jan 9 2022 07:32:04' },
   {formatName: "month", formatValue: "mmm", valueType: 'date', exampleInput: '2022-01-09'},
   {formatName: "year", formatValue: "yyyy", valueType: 'date', exampleInput: new Date('Sun Jan 9 2022 07:32:04 GMT-0400')},

   // Currency:
   {formatName: "usd", formatValue: '$0.00;($0.00)', valueType: 'number', exampleInput: 101.1 },
   {formatName: "eur", formatValue: '€0.00;(€0.00)', valueType: 'number', exampleInput: 101.1 },
   {formatName: "jpy", formatValue: '\\¥0.00;(\\¥0.00)', valueType: 'number', exampleInput: 101.1 },
   {formatName: "gbp", formatValue: '\\£0.00;(\\£0.00)', valueType: 'number', exampleInput: 101.1 },
   {formatName: "cad", formatValue: '\\C\\A$0.00;(\\C\\A$0.00)', valueType: 'number', exampleInput: 101.1 },
   {formatName: "chf", formatValue: '\\C\\H\\F_0.00;(\\C\\H\\F_0.00)', valueType: 'number', exampleInput: 101.1 },

   // Numbers
   {formatName: "num", formatValue: "0.##", valueType: 'number', exampleInput: 11.231 },
   {formatName: "num2", formatValue: "0.00", valueType: 'number', exampleInput: 11.2 },
   {formatName: "numk", formatValue: '0.0,"K"', valueType: 'number', exampleInput: 64201 },
   {formatName: "numm", formatValue: '0.0,,"M"', valueType: 'number', exampleInput: 64200001 },
   {formatName: "numb", formatValue: '0.0,,,"B"', valueType: 'number', exampleInput: 64200000001 },

   {formatName: "id", formatValue: "@", valueType: 'number', exampleInput: "11.231" },

   // Percent:
   {formatName: "pct", formatValue: "0.0#%", valueType: 'number', exampleInput: 0.731 },
];

export const getCustomFormats = () => {
    return getContext('customSettings').getCustomFormats() || [];
}

export const applyFormatting = (value, columnFormat) => {
    return ssf.format(columnFormat, value);
}

export const getColumnFormat = (formatName) => {
    let customFormats = getCustomFormats();
    return [... builtInFormats, ...customFormats].find(format => format.formatName === formatName)?.formatValue;
}