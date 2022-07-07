import * as ssf from "ssf";

export const AUTO_FORMAT_CODE = "auto";

/**
 * Describes implicit formats for columns having a certain name pattern and an evidence type (matched via matchingFunction).
 * This will only be applied to columns that cannot be matched to existing custom or built-in formats.
 * These won't be shown in the settings panel.
 * The ORDER in the array will take precedence as a columnName/evidenceType can be matched to multiple formats
 */
export const IMPLICIT_COLUMN_AUTO_FORMATS = [
  {
    name: "year",
    description:
      'When lowerCase(columnName)="year" with the column having numeric values will result in no formatting',
    matchingFunction: (columnName, columnEvidenceType) => {
      if (columnName && columnEvidenceType) {
        return (
          "year" === columnName.toLowerCase() &&
          columnEvidenceType.evidenceType === "number"
        ); //TODO use evidence type constant
      }
      return false;
    },
    format: {
      formatTag: "$implicitNumericYear",
      formatCode: AUTO_FORMAT_CODE,
      valueType: "number",
      exampleInput: 2013,
      titleTagReplacement: "",
      _autoFormat: {
        autoFormatCode: "@",
        truncateUnits: false,
      },
    },
  },
  {
    name: "id",
    description:
      'When lowerCase(columnName)="id" with the column having numeric values, then values will have no formatting',
    matchingFunction: (columnName, columnEvidenceType) => {
      if (columnName && columnEvidenceType) {
        return (
          "id" === columnName.toLowerCase() &&
          columnEvidenceType.evidenceType === "number"
        );
      }
      return false;
    },
    format: {
      formatTag: "$implicitNumericId",
      formatCode: AUTO_FORMAT_CODE,
      valueType: "number",
      exampleInput: 931201212031223422,
      titleTagReplacement: "",
      _autoFormat: {
        autoFormatFunction: (value) => {
          if (value !== null && value !== undefined && !isNaN(value)) {
            return value.toLocaleString("fullwide", { useGrouping: false });
          }
        },
      },
    },
  },
];

/**
 *
 * @param {*} format the format to update with auto formatting
 * @param {*} formatCode the code to use
 * @param {*} truncateNumbers should k, M, B column units be applied?
 * @returns the format
 */
export const configureAutoFormatting = (
  format,
  formatCode = "@",
  truncateUnits = false
) => {
  format._autoFormat = {
    autoFormatCode: formatCode,
    truncateUnits: truncateUnits,
  };
  return format;
};

export const isAutoFormat = (format, contextualFormatCode) => {
  let matchesCode = contextualFormatCode?.toLowerCase() === AUTO_FORMAT_CODE;
  let autoFormatCode =
    format._autoFormat?.autoFormatFunction ||
    format._autoFormat?.autoFormatCode;
  if (matchesCode && autoFormatCode !== undefined) {
    return true;
  } else {
    return false;
  }
};

export const applyAutoFormatting = (
  typedValue,
  columnFormat,
  columnUnits = undefined
) => {
  if (columnFormat._autoFormat?.autoFormatFunction) {
    return columnFormat.autoFormatFunction(typedValue, columnUnits);
  } else if (columnFormat._autoFormat?.autoFormatCode) {
    if (columnFormat._autoFormat.truncateUnits) {
      let { displayValue, suffix } = truncateColumnUnits(
        typedValue,
        columnUnits
      ); //needed for usd but not for implicit formats
      return (
        ssf.format(columnFormat._autoFormat.autoFormatCode, displayValue) +
        suffix
      );
    } else {
      return ssf.format(columnFormat._autoFormat.autoFormatCode, typedValue);
    }
  }
  console.warn(
    `Auto format method missing in ${JSON.stringify(
      columnFormat
    )} while applying to value ${typedValue}`
  );
  return typedValue;
};

function truncateColumnUnits(numericValue, columnUnits) {
  let displayValue, suffix;
  switch (columnUnits) {
    case "B":
      displayValue = numericValue / 1000000000;
      suffix = columnUnits;
      break;
    case "M":
      displayValue = numericValue / 1000000;
      suffix = columnUnits;
      break;
    case "k":
      displayValue = numericValue / 1000;
      suffix = columnUnits;
      break;
    default:
      displayValue = numericValue;
      suffix = "";
  }
  return {
    displayValue: displayValue,
    suffix: suffix,
  };
}
