import { tidy, summarize, min, max, median } from "@tidyjs/tidy";

/**
 *
 * @param {*} data
 * @param {*} column
 * @returns undefined if not all the defined values are numbers
 */
export function getColumnUnitSummary(data, columnName) {
  let seriesSummary;
  let seriesExtents = tidy(
    data,
    summarize({ min: min(columnName), max: max(columnName), median: median(columnName) })
  )[0];

  //TODO try to use summerize spec in tidy
  let  { maxDecimals, unitType } = summarizeUnits(data.map((row) => row[columnName]));

  seriesSummary = {
    min: seriesExtents.min,
    max: seriesExtents.max,
    median: seriesExtents.median,
    maxDecimals: maxDecimals,
    unitType: unitType,
  };
  return seriesSummary;
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

function summarizeUnits(series) {
  let undefinedCount = 0;
  let nullCount = 0;
  let stringCount = 0;
  let numberCount = 0;
  let dateCount = 0;
  let objectCount = 0;

  let maxDecimals = 0;

  if (series === undefined || series === null || series.length === 0) {
    return {
      maxDecimals: 0,
      unitType: "unknown"
    }
  } else {
    for (let i = 0; i < series.length; i++) {
      let nextElement = series[i];
      switch (typeof(nextElement)) {
        case "undefined":
          undefinedCount++;
          break;
        case "null": //typically this will be object
          nullCount++;
          break;
        case "number":
          numberCount++;
          let thisDecimalPlaces = nextElement.toString().split(".")[1]?.length;
          if (thisDecimalPlaces && thisDecimalPlaces > maxDecimals) {
            maxDecimals = thisDecimalPlaces;
          }
          break;
        case "string":
          stringCount++;
          break;
        case "object":
          if (nextElement instanceof Date) {
            dateCount++;
          } else if (nextElement === null) {
            nullCount++;
          } else {
            objectCount++;
          }
          break;
        case "date":
          dateCount++;
          break;
        case "function":
        default:
          break;
      }
    }
    let unitType = undefined;
    let emptyValueCount = undefinedCount + nullCount;
    if ((numberCount + emptyValueCount) === series.length) {
      unitType = "number";
    } else if ((stringCount + emptyValueCount) === series.length) {
      unitType = "string";
    } else if ((dateCount + emptyValueCount) === series.length) {
      unitType = "date";
    } else if ((objectCount + emptyValueCount) === series.length) {
      unitType = "object";
    } else {
      console.log(`Unknown unit type for series ${series} with ${series.length} elements`);
      console.log(`numberCount=${numberCount}, stringCount=${stringCount}, dateCount=${dateCount}, objectCount=${objectCount}, undefinedCount=${undefinedCount}, nullCount=${nullCount}`);
      unitType = "unknown";
    }
    return {
      maxDecimals: maxDecimals,
      unitType: unitType
    }
  }
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