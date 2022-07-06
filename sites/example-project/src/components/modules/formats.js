import * as ssf from "ssf";
import { getContext } from "svelte";
import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from '$lib/modules/globalContexts';
import { AUTO_FORMAT_CODE, BUILT_IN_FORMATS } from '$lib/modules/builtInFormats';


export const AXIS_FORMATTING_CONTEXT = 'axis';
export const VALUE_FORMATTING_CONTEXT = 'value';

export const getCustomFormats = () => {
  return getContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY).getCustomFormats() || [];
};

export const getColumnFormat = (formatTag) => {
  let customFormats = getCustomFormats();
  return [...BUILT_IN_FORMATS, ...customFormats].find(
    (format) => format.formatTag?.toLowerCase() === formatTag?.toLowerCase()
  );
};

export const applyFormatting = (value, columnFormat, formattingContext = VALUE_FORMATTING_CONTEXT, columnUnits = undefined) => {
  if (typeof(value) === 'number' && typeof(columnFormat) === 'string' && (columnFormat === 'yyyy' || columnFormat === 'mmm')) {
    return value.toString(); //TODO issue-333 consolidate legacy support
  } else {
    let formattingCode = getContextualFormattingCode(columnFormat, formattingContext);
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
    if (AUTO_FORMAT_CODE === formattingCode?.toLowerCase()) {
      try {
        return applyAutoFormatting(typedValue, columnFormat, columnUnits);
      } catch (error) {
        console.warn("Unexpected error applaying auto formatting");
        return typedValue;
      }
    } else {
      return ssf.format(formattingCode, typedValue);
    }
  }
};

export const applyTitleTagReplacement = (columnName, columnFormatSettings) => {
  let result = columnName;
  if (columnName && columnFormatSettings?.formatTag) {
    let lastIndexOfTag = columnName.toLowerCase().lastIndexOf(`_${columnFormatSettings.formatTag.toLowerCase()}`);
    let titleTagReplacement = "";
    if (lastIndexOfTag > 0) { //explicitly ignore columns starting with _, hence >0 instead of => 0
      if (typeof(columnFormatSettings?.titleTagReplacement) === 'string') {
        titleTagReplacement = columnFormatSettings.titleTagReplacement;
      }
      result = columnName.substring(0, lastIndexOfTag) + titleTagReplacement;
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
  let preFormattedValue = normalizedUserInput || format.exampleInput ||  defaultExample(format.valueType);
  if (preFormattedValue) {
    try {
      let columnUnits = undefined;
      if (format.formatCode === AUTO_FORMAT_CODE && format.valueType === "number") {
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
      return applyFormatting(preFormattedValue, format, VALUE_FORMATTING_CONTEXT, columnUnits);
    } catch (error) {
      //return default value
    }
  }
  return "";
}

function getContextualFormattingCode (columnFormat, formattingContext=VALUE_FORMATTING_CONTEXT) {
  if (formattingContext === AXIS_FORMATTING_CONTEXT && columnFormat?.axisFormatCode) {
    return columnFormat.axisFormatCode;
  }
  if (typeof(columnFormat) === 'string') {
    console.warn(`The first arg to getContextualFormattingCode(${columnFormat}, ${formattingContext}) should be an object, not a string`);
    return columnFormat; //TODO issue-333 consolidate legacy support
  } else {
    return columnFormat?.formatCode;
  }
}

function applyAutoFormatting(typedValue, columnFormat, columnUnits = undefined) {
  let displayValue;
  let suffix;
  switch (columnUnits) {
    case "B":
      displayValue = typedValue / 1000000000;
      suffix = columnUnits;
      break;
    case "M":
      displayValue = typedValue / 1000000;
      suffix = columnUnits;
      break;
    case "k":
      displayValue = typedValue / 1000;
      suffix = columnUnits;
      break;
    default:
      displayValue = typedValue;
      suffix = "";
  }
  return ssf.format(columnFormat._hiddenFormatCode, displayValue) + suffix;
}