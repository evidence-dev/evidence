import { tidy, summarize, min, max, median } from "@tidyjs/tidy";

/**
 *
 * @param {*} data
 * @param {*} column
 * @returns undefined if not all the defined values are numbers
 */
export function getColumnDataSummary(data, columnName) {
  try {
    let seriesSummary;
    let seriesExtents = tidy(
      data,
      summarize({ min: min(columnName), max: max(columnName), median: median(columnName) })
    )[0];

    let maxDecimals = maxDecimalPlacesInArray(data.map((row) => row[columnName]));
    seriesSummary = {
      min: seriesExtents.min,
      max: seriesExtents.max,
      median: seriesExtents.median,
      maxDecimals: maxDecimals,
    };
    return seriesSummary;
  } catch (error) {
    return undefined;
  }
}
export function getColumnExtentsLegacy(data, column) {
  var domainData = tidy(
    data,
    summarize({ min: min(column), max: max(column) })
  );
  let minValue = domainData[0].min;
  let maxValue = domainData[0].max;
  return [minValue, maxValue];
}

function checkValidNumericSeriesValue(value) {
  if (
    typeof(value) === "string" ||
    typeof(value) === "function" ||
    typeof(value) === "object"
  ) {
    if (value !== null) {
      throw Error(`Invalid numeric value ${value}`);
    }
  }
  //undefined and null are ignored.
}

/**
 * @param {array<number>} data 
 * @returns  an integer value with the maximum number of decimal places |
             undefined if the array contains no numbers
 * @throws {Error}  undefined if the array contains string, objects, or functions
 */
function maxDecimalPlacesInArray(series) {
  let maxDecimalPlaces = 0;
  for (let i = 0; i < series.length; i++) {
    let nextElement = series[i];
    checkValidNumericSeriesValue(nextElement);
    if (typeof nextElement === "number") {
      let thisDecimalPlaces = nextElement.toString().split(".")[1]?.length;
      if (thisDecimalPlaces && thisDecimalPlaces > maxDecimalPlaces) {
        maxDecimalPlaces = thisDecimalPlaces;
      }
    }
  }
  return maxDecimalPlaces;
}
