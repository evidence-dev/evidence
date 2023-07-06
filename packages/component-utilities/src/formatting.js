import ssf from 'ssf';
import { getContext } from 'svelte';
import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from './globalContexts';
import { findImplicitAutoFormat, autoFormat, fallbackFormat, isAutoFormat } from './autoFormatting';
import { BUILT_IN_FORMATS } from './builtInFormats';
import { standardizeDateString } from './dateParsing';
import { inferValueType } from './inferColumnTypes';

const AXIS_FORMATTING_CONTEXT = 'axis';
const VALUE_FORMATTING_CONTEXT = 'value';

export const getCustomFormats = () => {
	return getContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY).getCustomFormats() || [];
};

/**
 * @param {*} columnName the name of the column
 * @returns a format object (built-in or custom) based on the column name if it matches the pattern column_${formatTag}, otherwise returns undefined
 */
export const lookupColumnFormat = (columnName, columnEvidenceType, columnUnitSummary) => {
	let potentialFormatTag = maybeExtractFormatTag(columnName);

	if (columnEvidenceType.evidenceType === 'string') {
		return undefined;
	}

	if (potentialFormatTag) {
		let customFormats = getCustomFormats();
		let matchingFormat = [...BUILT_IN_FORMATS, ...customFormats].find(
			(format) => format.formatTag?.toLowerCase() === potentialFormatTag?.toLowerCase?.()
		);
		if (matchingFormat) {
			return matchingFormat;
		}
	}

	let matchingImplicitAutoFormat = findImplicitAutoFormat(
		columnName,
		columnEvidenceType,
		columnUnitSummary
	);
	if (matchingImplicitAutoFormat) {
		return matchingImplicitAutoFormat;
	}

	return undefined;
};

/**
 * Returns an Evidence format object to be used in the applyFormatting function
 * @param {string} formatString string containing an Excel-style format code, or a format name matching a built-in or custom format
 * @param {string} valueType optional - a string representing the data type within the column that will be formatted ('number', 'date', 'boolean', or 'string)
 * @returns a format object based on the formatString matching a built-in or custom format name, or a new custom format object containing an Excel-style format code
 */
export function getFormatObjectFromString(formatString, valueType = undefined) {
	let potentialFormatTag = formatString;
	let customFormats = getCustomFormats();
	let matchingFormat = [...BUILT_IN_FORMATS, ...customFormats].find(
		(format) => format.formatTag?.toLowerCase() === potentialFormatTag?.toLowerCase?.()
	);
	let newFormat = {};
	if (matchingFormat) {
		return matchingFormat;
	} else {
		newFormat = {
			formatTag: 'custom',
			formatCode: potentialFormatTag
		};
		if (valueType) {
			newFormat.valueType = valueType;
		}
		return newFormat;
	}
}

export const formatValue = (value, columnFormat = undefined, columnUnitSummary = undefined) => {
	try {
		return applyFormatting(value, columnFormat, columnUnitSummary, VALUE_FORMATTING_CONTEXT);
	} catch (error) {
		//fallback to default
		console.warn(
			`Unexpected error calling applyFormatting(${value}, ${columnFormat}, ${VALUE_FORMATTING_CONTEXT}, ${columnUnitSummary}). Error=${error}`
		);
		return value;
	}
};

export const formatAxisValue = (value, columnFormat = undefined, columnUnitSummary = undefined) => {
	try {
		return applyFormatting(value, columnFormat, columnUnitSummary, AXIS_FORMATTING_CONTEXT);
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
		let titleTagReplacement = '';
		if (lastIndexOfTag > 0) {
			//explicitly ignore columns starting with _, hence >0 instead of => 0
			if (typeof columnFormatSettings?.titleTagReplacement === 'string') {
				titleTagReplacement = columnFormatSettings.titleTagReplacement;
			}
			result = columnName.substring(0, lastIndexOfTag) + titleTagReplacement;
		}
	}
	return result;
};

export const defaultExample = (valueType) => {
	switch (valueType) {
		case 'number':
			return 1234;
		case 'date':
			return '2022-01-03';
		default:
			return undefined;
	}
};

export const formatExample = (format) => {
	let normalizedUserInput = format.userInput?.trim();
	let preFormattedValue =
		normalizedUserInput || format.exampleInput || defaultExample(format.valueType);

	if (preFormattedValue) {
		try {
			let columnUnitSummary = undefined;
			if (format.valueType === 'number') {
				let numericValue = Number(preFormattedValue);
				columnUnitSummary = {
					min: numericValue,
					max: numericValue,
					median: numericValue,
					maxDecimals: numericValue.toString().split('.')[1]?.length || 0,
					unitType: 'number'
				};
			}
			return applyFormatting(
				preFormattedValue,
				format,
				columnUnitSummary,
				VALUE_FORMATTING_CONTEXT
			);
		} catch (error) {
			//return default value
		}
	}
	return '';
};

function applyFormatting(
	value,
	columnFormat = undefined,
	columnUnitSummary = undefined,
	formattingContext = VALUE_FORMATTING_CONTEXT
) {
	if (value === undefined || value === null) {
		return '-';
	}

	let result = undefined;
	if (columnFormat) {
		try {
			let formattingCode = getEffectiveFormattingCode(columnFormat, formattingContext);
			let typedValue;
			try {
				if (columnFormat.valueType === 'date' && typeof value === 'string') {
					typedValue = new Date(standardizeDateString(value));
				} else if (
					columnFormat.valueType === 'number' &&
					typeof value !== 'number' &&
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
					result = autoFormat(typedValue, columnFormat, columnUnitSummary);
				} catch (error) {
					console.warn(`Unexpected error applying auto formatting. Error=${error}`);
				}
			} else {
				result = ssf.format(formattingCode, typedValue);
			}
		} catch (error) {
			console.warn(`Unexpected error applying formatting ${error}`);
		}
	}
	if (result === undefined) {
		result = fallbackFormat(value, columnUnitSummary);
	}
	return result;
}
function getEffectiveFormattingCode(columnFormat, formattingContext = VALUE_FORMATTING_CONTEXT) {
	if (typeof columnFormat === 'string') {
		// This should only be used by end users, not by components.
		return columnFormat;
	} else {
		if (formattingContext === AXIS_FORMATTING_CONTEXT && columnFormat?.axisFormatCode) {
			return columnFormat.axisFormatCode;
		}
		return columnFormat?.formatCode;
	}
}

/**
 * Extracts a possible format tag from a column name based on the column name pattern
 * @returns "column_${formatTag}" will return ${formatTag} or undefined if the columnName doesn't match the pattern
 */
function maybeExtractFormatTag(columnName) {
	let normalizedColName = columnName.toLowerCase();
	let lastUnderScoreIndex = normalizedColName.lastIndexOf('_');

	if (lastUnderScoreIndex > 0) {
		return normalizedColName.substr(lastUnderScoreIndex).replace('_', '');
	} else {
		return undefined;
	}
}

/**
 * Formats a value to whichever format is passed in
 * @param {*} value the value to be formatted
 * @param {string} format string containing an Excel-style format code, or a format name matching a built-in or custom format
 * @returns a formatted value
 */
export function fmt(value, format) {
	let formatObj = getFormatObjectFromString(format);
	let valueType = inferValueType(value);
	formatObj.valueType = valueType;
	return formatValue(value, formatObj);
}
