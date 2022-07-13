import * as ssf from "ssf";

export const AUTO_FORMAT_CODE = "auto";

/**
 * The number of units to display the median value in the series 
 */
const AUTO_FORMAT_MEDIAN_PRECISION = 3;
/**
 * Describes implicit formats for columns having a certain name pattern and an evidence type (matched via matchingFunction).
 * This will only be applied to columns that cannot be matched to existing custom or built-in formats.
 * These won't be shown in the settings panel.
 * The ORDER in the array will take precedence as a columnName/evidenceType can be matched to multiple formats
 */
const IMPLICIT_COLUMN_AUTO_FORMATS = [
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
      formatCode: AUTO_FORMAT_CODE,
      valueType: "number",
      exampleInput: 2013,
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
      formatCode: AUTO_FORMAT_CODE,
      valueType: "number",
      exampleInput: 931201212031223422,
      _autoFormat: {
        autoFormatFunction: (typedValue) => {
          if (typedValue !== null && typedValue !== undefined && !isNaN(typedValue)) {
            return typedValue.toLocaleString("fullwide", { useGrouping: false });
          } else {
            return typedValue;
          }
        },
      },
    },
  },
  {
    name: "defaultDate",
    description:
      'Formatting for Default Date',
    matchingFunction: (columnName, columnEvidenceType) => {
      if (columnEvidenceType) {
        return columnEvidenceType.evidenceType === "date";
      }
      return false;
    },
    format: {
      formatCode: AUTO_FORMAT_CODE,
      valueType: "date",
      exampleInput: "Sat Jan 01 2022 03:15:00 GMT-0500",
      _autoFormat: {
        autoFormatCode: "YYYY-MM-DD",
        truncateUnits: false,
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

export const findImplicitAutoFormat = (columnName, columnEvidenceType) => {
  let matched = IMPLICIT_COLUMN_AUTO_FORMATS.find(
    (implicitFormat) =>
      implicitFormat.matchingFunction(columnName, columnEvidenceType)
  );
  return matched?.format;
}


export const isAutoFormat = (format, effectiveCode) => {
  let matchesCode = ( (effectiveCode || format.formatCode)?.toLowerCase() === AUTO_FORMAT_CODE);
  let autoFormatCode =
    format._autoFormat?.autoFormatFunction ||
    format._autoFormat?.autoFormatCode;
  if (matchesCode && autoFormatCode !== undefined) {
    return true;
  } else {
    return false;
  }
};

/**
 * Formatting logic for formats with formatCode=AUTO_FORMAT_CODE
 * @param {*} typedValue the value to be formatted
 * @param {*} columnFormat the auto formatting description
 * @param {*} columnUnitSummary the summary of units in the column (only applicable to numbered columns)
 * @returns formattedv value
 */
export const autoFormat = (typedValue, columnFormat, columnUnitSummary = undefined) => {
  if (columnFormat._autoFormat?.autoFormatFunction) {
    return columnFormat.autoFormatFunction(typedValue, columnFormat, columnUnitSummary);
  } else if (columnFormat._autoFormat.autoFormatCode) {
    let valueType = columnFormat.valueType;
    if ("number" === valueType && columnUnitSummary?.median) {
      let median = columnUnitSummary?.median;
      let autoFormatCode  = columnFormat?._autoFormat?.autoFormatCode;
      let truncateUnits  = columnFormat?._autoFormat?.truncateUnits;

      let unitValue = typedValue;
      let unit = "";
 
      if (truncateUnits) {
        unit = getAutoColumnUnit(median);
        unitValue = applyColumnUnits(typedValue, unit);
      }

      return ssf.format(autoFormatCode, unitValue) + unit;
    }
  } else {
    console.warn("autoFormat called without a formatCode or function");
  }
  return typedValue;
}

/**
 * Formatting for any column without formatting settings
 * @param {*} typedValue a value of type number|date|string
 * @param {*} columnUnitSummary
 * @returns the formatted value
 */
export const defaultFormat = (typedValue, columnUnitSummary = undefined) => {
  if (typeof(typedValue) === "number") {
    if (columnUnitSummary && columnUnitSummary.median !== undefined) {

      let effectiveFormatCode;
      let valueInUnitTerms = typedValue;
      let columnUnits = "";
      let median = columnUnitSummary.median;

      if (columnUnitSummary?.maxDecimals === 0) {
        //if there are no decimals involved show the entire number
        valueInUnitTerms = typedValue;
        effectiveFormatCode = "#,##0";
      } else {
        let medianInUnitTerms;
        columnUnits = getAutoColumnUnit(medianInUnitTerms);
        if (columnUnits) {
          medianInUnitTerms = applyColumnUnits(median, columnUnits);
          valueInUnitTerms = applyColumnUnits(typedValue, columnUnits);
        } else {
          medianInUnitTerms = median;
          valueInUnitTerms = typedValue;
        }
        let medianBase10Exponent = base10Exponent(medianInUnitTerms);
        let valueBase10Exponent = base10Exponent(valueInUnitTerms);
        let significantDigitsToDisplay = Math.max((valueBase10Exponent - medianBase10Exponent) + AUTO_FORMAT_MEDIAN_PRECISION, AUTO_FORMAT_MEDIAN_PRECISION);

        let base = valueBase10Exponent;
        effectiveFormatCode = "";
        while (base > (valueBase10Exponent - significantDigitsToDisplay)) {
          if (base > 0) {
            effectiveFormatCode += "#";
            if (base % 3 === 0) {
              effectiveFormatCode += ",";
            }
          } else if (base === 0) {
            effectiveFormatCode += "0";
            if ((base - 1 )> (valueBase10Exponent - significantDigitsToDisplay)) {
              //add a decimal if there are more significant digits to display
              effectiveFormatCode += ".";
            }
          } else {
            //base < 0
            effectiveFormatCode += "0";
          }
          base--;
        }
      }
      return ssf.format(effectiveFormatCode, valueInUnitTerms) + columnUnits;
    } else {
      return typedValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
  } else if (typedValue !== undefined && typedValue !== null) {
    return typedValue?.toString();
  } else {
    return "-";
  }
}

function applyColumnUnits (value, unit) {
  switch(unit) {
    case "B":
      return value / 1000000000;
    case "M":
      return value / 1000000;
    case "k":
      return value / 1000;
    default:
      return value;
  }
}

function getAutoColumnUnit(value) {
  let abosoluteValue = Math.abs(value);
  if(abosoluteValue >= 1000000000) {
    return "B"
  } else if(abosoluteValue >= 1000000){
    return "M";
  } else if(abosoluteValue >= 1000){
    return "k";
  } else {
    return "";
  }
}

function base10Exponent(value) {
  return Math.floor(Math.log10(value));
}
