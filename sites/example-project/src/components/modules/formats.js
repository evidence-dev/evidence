import * as ssf from "ssf";
import { getContext } from "svelte";

//see https://www.benlcollins.com/spreadsheets/google-sheets-custom-number-format/
//TODO note 0.##% is not ideal as it could show something like 15.% => https://superuser.com/questions/205759/format-a-number-with-optional-decimal-places-in-excel
export const builtInFormats = [
  // Date/Time:
  {
    formatTag: "ddd",
    formatCode: "ddd",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "dddd",
    formatCode: "dddd",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "mmm",
    formatCode: "mmm",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "mmmm",
    formatCode: "mmmm",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "yyyy",
    formatCode: "yyyy",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "shortdate",
    formatCode: "mmm d/yy",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "longdate",
    formatCode: "mmmm d, yyyy",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "fulldate",
    formatCode: "dddd mmmm d, yyyy",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "mdy",
    formatCode: "m/d/y",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "dmy",
    formatCode: "d/m/y",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "hms",
    formatCode: "H:M:S AM/PM",
    formatCategory: "date",
    valueType: "date",
    exampleInput: "2022-01-09T11:45:23",
  },

  // Currency:
  {
    formatTag: "usd",
    formatCode: "$#,##0",
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd0",
    formatCode: "$#,##0",
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd1",
    formatCode: "$#,##0.0",
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd2",
    formatCode: "$#,##0.00",
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd0k",
    formatCode: '$#,##0,"k"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd1k",
    formatCode: '$#,##0.0,"k"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd2k",
    formatCode: '$#,##0.00,"k"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd0m",
    formatCode: '$#,##0,,"M"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd1m",
    formatCode: '$#,##0.0,,"M"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd2m",
    formatCode: '$#,##0.00,,"M"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd0b",
    formatCode: '$#,##0,,,"B"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd1b",
    formatCode: '$#,##0.0,,,"B"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "usd2b",
    formatCode: '$#,##0.00,,,"B"',
    formatCategory: "currency",
    parentFormat: "usd",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad",
    formatCode: "$#,##0",
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad0",
    formatCode: "$#,##0",
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad1",
    formatCode: "$#,##0.0",
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad2",
    formatCode: "$#,##0.00",
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad0k",
    formatCode: '$#,##0,"k"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad1k",
    formatCode: '$#,##0.0,"k"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad2k",
    formatCode: '$#,##0.00,"k"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 64201,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad0m",
    formatCode: '$#,##0,,"M"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad1m",
    formatCode: '$#,##0.0,,"M"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad2m",
    formatCode: '$#,##0.00,,"M"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 42539483,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad0b",
    formatCode: '$#,##0,,,"B"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad1b",
    formatCode: '$#,##0.0,,,"B"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "cad2b",
    formatCode: '$#,##0.00,,,"B"',
    formatCategory: "currency",
    parentFormat: "cad",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 1384937584,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "eur",
    formatCode: "€#,##0.00",
    formatCategory: "currency",
    parentFormat: "eur",
    axisFormatCode: "€#,##0",
    titleTagReplacement: " (€)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "jpy",
    formatCode: '"¥"#,##0.00',
    formatCategory: "currency",
    parentFormat: "jpy",
    axisFormatCode: '"¥"#,##0',
    titleTagReplacement: " (¥)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "gbp",
    formatCode: '"£"#,##0.00',
    formatCategory: "currency",
    parentFormat: "gbp",
    axisFormatCode: '"£"#,##0',
    titleTagReplacement: " (£)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "chf",
    formatCode: '"CHF" #,##0.00',
    formatCategory: "currency",
    parentFormat: "chf",
    axisFormatCode: '"CHF" #,##0',
    titleTagReplacement : " (CHF)",
    valueType: "number",
    exampleInput: 101.1,
  },

  // Numbers:
  {
    formatTag: "num0",
    formatCode: "#,##0",
    formatCategory: "number",
    valueType: "number",
    exampleInput: 11.23168,
  },
  {
    formatTag: "num1",
    formatCode: "#,##0.0",
    formatCategory: "number",
    valueType: "number",
    exampleInput: 11.23168,
  },
  {
    formatTag: "num2",
    formatCode: "#,##0.00",
    formatCategory: "number",
    valueType: "number",
    exampleInput: 11.23168,
  },
  {
    formatTag: "num3",
    formatCode: "#,##0.000",
    formatCategory: "number",
    valueType: "number",
    exampleInput: 11.23168,
  },
  {
    formatTag: "num4",
    formatCode: "#,##0.0000",
    formatCategory: "number",
    valueType: "number",
    exampleInput: 11.23168,
  },
  {
    formatTag: "num0k",
    formatCode: '#,##0,"k"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 64201,
  },
  {
    formatTag: "num1k",
    formatCode: '#,##0.0,"k"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 64201,
  },
  {
    formatTag: "num2k",
    formatCode: '#,##0.00,"k"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 64201,
  },
  {
    formatTag: "num0m",
    formatCode: '#,##0,,"M"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 42539483,
  },
  {
    formatTag: "num1m",
    formatCode: '#,##0.0,,"M"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 42539483,
  },
  {
    formatTag: "num2m",
    formatCode: '#,##0.00,,"M"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 42539483,
  },
  {
    formatTag: "num0b",
    formatCode: '#,##0,,,"B"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 1384937584,
  },
  {
    formatTag: "num1b",
    formatCode: '#,##0.0,,,"B"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 1384937584,
  },
  {
    formatTag: "num2b",
    formatCode: '#,##0.00,,,"B"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: 1384937584,
  },
  {
    formatTag: "id",
    formatCode: "0",
    formatCategory: "number",
    valueType: "number",
    exampleInput: "921594675",
  },
  {
    formatTag: "fract",
    formatCode: "# ?/?",
    formatCategory: "number",
    valueType: "number",
    exampleInput: "0.25",
  },
  {
    formatTag: "mult",
    formatCode: '#,##0.0"x"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: "5.32",
  },
  {
    formatTag: "mult0",
    formatCode: '#,##0"x"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: "5.32",
  },
  {
    formatTag: "mult1",
    formatCode: '#,##0.0"x"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: "5.32",
  },
  {
    formatTag: "mult2",
    formatCode: '#,##0.00"x"',
    formatCategory: "number",
    valueType: "number",
    exampleInput: "5.32",
  },
  {
    formatTag: "sci",
    formatCode: '0.00E+0',
    formatCategory: "number",
    valueType: "number",
    exampleInput: "16546.1561",
  },

  // Percent:
  {
    formatTag: "pct",
    formatCode: "#,##0%",
    formatCategory: "percent",
    valueType: "number",
    exampleInput: 0.731,
    titleTagReplacement: ""
  },
  {
    formatTag: "pct0",
    formatCode: "#,##0%",
    formatCategory: "percent",
    valueType: "number",
    exampleInput: 0.731,
    titleTagReplacement: ""
  },
  {
    formatTag: "pct1",
    formatCode: "#,##0.0%",
    formatCategory: "percent",
    valueType: "number",
    exampleInput: 0.731,
    titleTagReplacement: ""
  },
  {
    formatTag: "pct2",
    formatCode: "#,##0.00%",
    formatCategory: "percent",
    valueType: "number",
    exampleInput: 0.731,
    titleTagReplacement: ""
  },
  {
    formatTag: "pct3",
    formatCode: "#,##0.000%",
    formatCategory: "percent",
    valueType: "number",
    exampleInput: 0.731,
    titleTagReplacement: ""
  },
];

export const getCustomFormats = () => {
  return getContext("customSettings").getCustomFormats() || [];
};

export const getColumnFormat = (formatTag) => {
  let customFormats = getCustomFormats();
  return [...builtInFormats, ...customFormats].find(
    (format) => format.formatTag === formatTag
  );
};

export const getFormatTag = (col) => {
  if (typeof(col) === 'string') {
    return col; //TODO issue-333 consolidate legacy support
  } else {
    return col?.formatTag;
  }
}

export const getFormatCode = (col) => {
  if (typeof(col) === 'string') {
    return col; //TODO issue-333 consolidate legacy support
  } else {
    return col?.formatCode;
  }
}

export const getAxisFormatCode = (col) =>  {
  if (col?.axisFormatCode) {
    return col.axisFormatCode;
  } else {
    return getFormatCode(col);
  }
}

export const applyFormatting = (value, columnFormat) => {
  if (typeof(value)==='number' && (columnFormat === 'yyyy' || columnFormat == 'mmm')) {
    return value.toString(); //TODO issue-333 consolidate legacy support
  } else {
    let typedValue;
    try {
      if (columnFormat.valueType === 'date' && typeof(value) === 'string') {
        typedValue = new Date(value);
      } else if (columnFormat.valueType === 'number' && typeof(value) !== 'number' && !Number.isNaN(value)) {
        typedValue = Number(value);
      }  else {
        typedValue = value;
      }
    } catch (error) {
      typedValue = value;
    }
    return ssf.format(columnFormat, typedValue);
  }
};

export const applyTitleTagReplacement = (columnName, columnFormatSettings) => {
  let result = columnName;
  if (columnName && columnFormatSettings?.formatTag && (typeof(columnFormatSettings?.titleTagReplacement) === 'string')) {
    let lastIndexOfTag = columnName.toLowerCase().lastIndexOf(`_${columnFormatSettings.formatTag.toLowerCase()}`);
    if (lastIndexOfTag > 0) { //explicitly ignore columns starting with _
      result = columnName.substring(0, lastIndexOfTag) + columnFormatSettings.titleTagReplacement;
    }
  }
  return result;
}

export const defaultExample = (valueType) => {
  switch (valueType) {
    case "number":
      return 1234;
    case "date":
      return "Jan 3, 2022";
    default:
      return undefined;
  }
};

export const formatExample = (format) => {
  let normalizedUserInput = format.userInput?.trim();
  let preFormattedValue =
    normalizedUserInput ||
    format.exampleInput ||
    defaultExample(format.valueType);
  if (preFormattedValue) {
    try {
      let typedPreformattedValue;
      switch (format.valueType) {
        case "number": {
          typedPreformattedValue = Number(preFormattedValue);
          if (Number.isNaN(preFormattedValue)) {
            throw "Input is not a number";
          }
          break;
        }
        case "date": {
          try{
            typedPreformattedValue = new Date(preFormattedValue);
          } catch(error) {
            throw "Input is not a date";
          }
          break;
        }
        default: {
          typedPreformattedValue = preFormattedValue;
          break;
        }
      }
      if (typedPreformattedValue) {
        return ssf.format(format.formatCode, typedPreformattedValue);
      }
    } catch (error) {
      //return default value
    }
  }
  return "";
}