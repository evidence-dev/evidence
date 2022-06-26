import * as ssf from "ssf";
import { getContext } from "svelte";

//see https://www.benlcollins.com/spreadsheets/google-sheets-custom-number-format/
//TODO note 0.##% is not ideal as it could show something like 15.% => https://superuser.com/questions/205759/format-a-number-with-optional-decimal-places-in-excel
export const builtInFormats = [
  // Date/Time:
  {
    formatTag: "date",
    formatCode: "MMM d, yyyy",
    valueType: "date",
    exampleInput: "Jan 9 2022 07:32:04",
  },
  {
    formatTag: "month",
    formatCode: "mmm",
    valueType: "date",
    exampleInput: "2022-01-09",
  },
  {
    formatTag: "year",
    formatCode: "yyyy",
    valueType: "date",
    exampleInput: "2022/01/09",
  },

  // Currency:
  {
    formatTag: "usd",
    formatCode: "$#,##0.00",
    axisFormatCode: "$#,##0",
    valueType: "number",
    exampleInput: 101.1,
    titleTagReplacement: " ($)",
  },
  {
    formatTag: "eur",
    formatCode: "€#,##0.00",
    axisFormatCode: "€#,##0",
    titleTagReplacement: " (€)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "jpy",
    formatCode: '"¥"#,##0.00',
    axisFormatCode: '"¥"#,##0',
    titleTagReplacement: " (¥)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "gbp",
    formatCode: '"£"#,##0.00',
    axisFormatCode: '"£"#,##0',
    titleTagReplacement: " (£)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "cad",
    formatCode: '"CA$"#,##0.00',
    axisFormatCode: '"CA$"#,##0',
    titleTagReplacement: " ($)",
    valueType: "number",
    exampleInput: 101.1,
  },
  {
    formatTag: "chf",
    formatCode: '"CHF" #,##0.00',
    axisFormatCode: '"CHF" #,##0',
    titleTagReplacement : " (CHF)",
    valueType: "number",
    exampleInput: 101.1,
  },

  // Numbers:
  {
    formatTag: "num",
    formatCode: "#,##0",
    valueType: "number",
    exampleInput: 11.231,
  },
  {
    formatTag: "num2",
    formatCode: "0.00",
    valueType: "number",
    exampleInput: 11.2,
  },
  {
    formatTag: "num1k",
    formatCode: '0.0,"K"',
    valueType: "number",
    exampleInput: 64201,
  },
  {
    formatTag: "id",
    formatCode: "@",
    valueType: "number",
    exampleInput: "921594675",
  },
  // Percent:
  {
    formatTag: "pct",
    formatCode: "#,##0%",
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
      console.log(error);
    }
  }
  return "";
}