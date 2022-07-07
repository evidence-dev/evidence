import * as ssf from "ssf";
import { getContext } from "svelte";
import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from "$lib/modules/globalContexts";
import {
  AUTO_FORMAT_CODE,
  IMPLICIT_COLUMN_AUTO_FORMATS,
  applyAutoFormatting,
} from "$lib/modules/autoFormatting";
import { BUILT_IN_FORMATS } from "$lib/modules/builtInFormats";
import { isAutoFormat } from "./autoFormatting";

const AXIS_FORMATTING_CONTEXT = "axis";
const VALUE_FORMATTING_CONTEXT = "value";

export const getCustomFormats = () => {
  return (
    getContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY).getCustomFormats() || []
  );
};

/**
 * @param {*} columnName the name of the column
 * @returns a format object (built-in or custom) based on the column name if it matches the pattern column_${formatTag}, otherwise returns undefined
 */
export const lookupColumnFormat = (columnName, columnEvidenceType) => {
  let potentialFormatTag = maybeExtractFormatTag(columnName);

  if (potentialFormatTag) {
    let customFormats = getCustomFormats();
    let matchingFormat = [...BUILT_IN_FORMATS, ...customFormats].find(
      (format) =>
        format.formatTag?.toLowerCase() === potentialFormatTag?.toLowerCase()
    );
    if (matchingFormat) {
      return matchingFormat;
    }
  }
  let matchingImplicitFormatDescriptor = IMPLICIT_COLUMN_AUTO_FORMATS.find(
    (implicitFormat) =>
      implicitFormat.matchingFunction(columnName, columnEvidenceType)
  );
  if (matchingImplicitFormatDescriptor) {
    return matchingImplicitFormatDescriptor.format;
  }
  return undefined;
};

export const formatValue = (value, columnFormat, columnUnits = undefined) => {
  try {
    return applyFormatting(
      value,
      columnFormat,
      VALUE_FORMATTING_CONTEXT,
      columnUnits
    );
  } catch (error) {
    //fallback to default
    console.warn(
      `Unexpected error calling applyFormatting(${value}, ${columnFormat}, ${VALUE_FORMATTING_CONTEXT}, ${columnUnits}). Error=${error}`
    );
    return value;
  }
};

export const formatAxisValue = (value, columnFormat, columnUnits) => {
  try {
    let formattedValue = applyFormatting(
      value,
      columnFormat,
      AXIS_FORMATTING_CONTEXT,
      columnUnits
    );
    if (formattedValue) {
      return formattedValue;
    }
  } catch (error) {
    //fallback to default
  }
  return value;
};

export const applyTitleTagReplacement = (columnName, columnFormatSettings) => {
  let result = columnName;
  if (columnName && columnFormatSettings?.formatTag) {
    let lastIndexOfTag = columnName
      .toLowerCase()
      .lastIndexOf(`_${columnFormatSettings.formatTag.toLowerCase()}`);
    let titleTagReplacement = "";
    if (lastIndexOfTag > 0) {
      //explicitly ignore columns starting with _, hence >0 instead of => 0
      if (typeof columnFormatSettings?.titleTagReplacement === "string") {
        titleTagReplacement = columnFormatSettings.titleTagReplacement;
      }
      result = columnName.substring(0, lastIndexOfTag) + titleTagReplacement;
    }
  }
  return result;
};

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
      let columnUnits = undefined;
      if (
        format.formatCode === AUTO_FORMAT_CODE &&
        format.valueType === "number"
      ) {
        let numericValue = Number(preFormattedValue);
        if (!Number.isNaN(numericValue)) {
          if (numericValue >= 1000000000) {
            columnUnits = "B";
          } else if (numericValue >= 1000000) {
            columnUnits = "M";
          } else if (numericValue >= 1000) {
            columnUnits = "k";
          }
        }
      }
      return applyFormatting(
        preFormattedValue,
        format,
        VALUE_FORMATTING_CONTEXT,
        columnUnits
      );
    } catch (error) {
      //return default value
    }
  }
  return "";
};

function applyFormatting(
  value,
  columnFormat,
  formattingContext = VALUE_FORMATTING_CONTEXT,
  columnUnits = undefined
) {
  if (value === undefined || value === null) {
    return "-";
  }
  let result = undefined;
  if (columnFormat) {
    try {
      let formattingCode = getContextualFormattingCode(
        columnFormat,
        formattingContext
      );
      let typedValue;
      try {
        if (columnFormat.valueType === "date" && typeof value === "string") {
          typedValue = new Date(value);
        } else if (
          columnFormat.valueType === "number" &&
          typeof value !== "number" &&
          !Number.isNaN(value)
        ) {
          typedValue = Number(value);
        } else {
          typedValue = value;
        }
      } catch (error) {
        typedValue = value;
      }
      if (isAutoFormat(columnFormat, formattingCode)) {
        try {
          result = applyAutoFormatting(typedValue, columnFormat, columnUnits);
        } catch (error) {
          console.warn(
            `Unexpected error applying auto formatting. Error=${error}`
          );
        }
      } else {
        result = ssf.format(formattingCode, typedValue);
      }
    } catch (error) {
      console.warn(`Unexpected error applying formatting ${error}`);
    }
  }
  if (result === undefined) {
    result = applyDefaultFormatting(value, columnFormat, columnUnits);
  }
  return result;
}
function getContextualFormattingCode(
  columnFormat,
  formattingContext = VALUE_FORMATTING_CONTEXT
) {
  if (typeof columnFormat === "string") {
    console.warn(
      `The first arg to getContextualFormattingCode(${columnFormat}, ${formattingContext}) should be an object, not a string`
    );
    return columnFormat; //TODO issue-333 consolidate legacy support
  } else {
    if (
      formattingContext === AXIS_FORMATTING_CONTEXT &&
      columnFormat?.axisFormatCode
    ) {
      return columnFormat.axisFormatCode;
    }
    return columnFormat?.formatCode;
  }
}

function applyDefaultFormatting(
  typedValue,
  columnFormat = undefined,
  columnUnits = undefined
) {
  if (typeof typedValue === "number") {
    return typedValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } else {
    return typedValue?.toString();
  }
}

/**
 * Extracts a possible format tag from a column name based on the column name pattern
 * @returns "column_${formatTag}" will return ${formatTag} or undefined if the columnName doesn't match the pattern
 */
function maybeExtractFormatTag(columnName) {
  let normalizedColName = columnName.toLowerCase();
  let lastUnderScoreIndex = normalizedColName.lastIndexOf("_");

  if (lastUnderScoreIndex > 0) {
    return normalizedColName.substr(lastUnderScoreIndex).replace("_", "");
  } else {
    return undefined;
  }
}
