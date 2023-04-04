import ssf from 'ssf';

export const AUTO_FORMAT_CODE = 'auto';

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
		name: 'year',
		description:
			'When lowerCase(columnName)="year" with the column having numeric values will result in no formatting',
		matchingFunction: (columnName, evidenceTypeDescriptor, columnUnitSummary) => {
			if (columnName && evidenceTypeDescriptor) {
				return (
					'year' === columnName.toLowerCase() &&
					(evidenceTypeDescriptor?.evidenceType === 'number' ||
						columnUnitSummary?.unitType === 'number')
				); //TODO use evidence type constant
			}
			return false;
		},
		format: {
			formatCode: AUTO_FORMAT_CODE,
			valueType: 'number',
			exampleInput: 2013,
			_autoFormat: {
				autoFormatCode: '@',
				truncateUnits: false
			}
		}
	},
	{
		name: 'id',
		description:
			'When lowerCase(columnName)="id" with the column having numeric values, then values will have no formatting',
		matchingFunction: (columnName, evidenceTypeDescriptor, columnUnitSummary) => {
			if (columnName && evidenceTypeDescriptor) {
				return (
					'id' === columnName.toLowerCase() &&
					(evidenceTypeDescriptor?.evidenceType === 'number' ||
						columnUnitSummary?.unitType === 'number')
				);
			}
			return false;
		},
		format: {
			formatCode: AUTO_FORMAT_CODE,
			valueType: 'number',
			exampleInput: 93120121,
			_autoFormat: {
				autoFormatFunction: (typedValue) => {
					if (typedValue !== null && typedValue !== undefined && !isNaN(typedValue)) {
						return typedValue.toLocaleString('fullwide', {
							useGrouping: false
						});
					} else {
						return typedValue;
					}
				}
			}
		}
	},
	{
		name: 'defaultDate',
		description: 'Formatting for Default Date',
		matchingFunction: (columnName, evidenceTypeDescriptor, columnUnitSummary) => {
			if (evidenceTypeDescriptor) {
				return (
					evidenceTypeDescriptor?.evidenceType === 'date' || columnUnitSummary?.unitType === 'date'
				);
			}
			return false;
		},
		format: {
			formatCode: AUTO_FORMAT_CODE,
			valueType: 'date',
			exampleInput: 'Sat Jan 01 2022 03:15:00 GMT-0500',
			_autoFormat: {
				autoFormatCode: 'YYYY-MM-DD',
				truncateUnits: false
			}
		}
	}
];

/**
 *
 * @param {number | undefined} value
 * @param {string} unit
 * @returns {number | undefined} the value in the given unit
 */
export const applyColumnUnits = (value, unit) => {
	switch (unit) {
		case 'T':
			return value / 1000000000000;
		case 'B':
			return value / 1000000000;
		case 'M':
			return value / 1000000;
		case 'k':
			return value / 1000;
		default:
			return value;
	}
};

/**
 *
 * @param {*} format the format to update with auto formatting
 * @param {*} formatCode the code to use
 * @param {*} truncateNumbers should k, M, B column units be applied?
 * @returns the format
 */
export const configureAutoFormatting = (format, formatCode = '@', truncateUnits = false) => {
	format._autoFormat = {
		autoFormatCode: formatCode,
		truncateUnits: truncateUnits
	};
	return format;
};

export const isAutoFormat = (format, effectiveCode) => {
	let matchesCode = (effectiveCode || format.formatCode)?.toLowerCase() === AUTO_FORMAT_CODE;
	let autoFormatCode = format._autoFormat?.autoFormatFunction || format._autoFormat?.autoFormatCode;
	if (matchesCode && autoFormatCode !== undefined) {
		return true;
	} else {
		return false;
	}
};

export const generateImplicitNumberFormat = (columnUnitSummary, maxDisplayDecimals = 7) => {
	let effectiveFormatCode;
	let columnUnits = '';

	let median = columnUnitSummary?.median;
	let truncateUnits;

	if (median !== undefined) {
		let medianInUnitTerms;
		columnUnits = getAutoColumnUnit(median);
		if (columnUnits) {
			medianInUnitTerms = applyColumnUnits(median, columnUnits);
			truncateUnits = true;
		} else {
			medianInUnitTerms = median;
			truncateUnits = false;
		}

		if (columnUnitSummary.maxDecimals === 0 && !truncateUnits) {
			effectiveFormatCode = '#,##0';
		} else {
			effectiveFormatCode = computeNumberAutoFormatCode(medianInUnitTerms, maxDisplayDecimals);
		}
	} else {
		effectiveFormatCode = '#,##0';
		truncateUnits = false;
	}

	return {
		formatCode: AUTO_FORMAT_CODE,
		valueType: 'number',
		_autoFormat: {
			autoFormatCode: effectiveFormatCode,
			truncateUnits: truncateUnits,
			columnUnits: columnUnits
		}
	};
};

export const findImplicitAutoFormat = (columnName, evidenceTypeDescriptor, columnUnitSummary) => {
	let matched = IMPLICIT_COLUMN_AUTO_FORMATS.find((implicitFormat) =>
		implicitFormat.matchingFunction(columnName, evidenceTypeDescriptor, columnUnitSummary)
	);
	if (matched) {
		return matched.format;
	} else {
		if (columnUnitSummary?.unitType === 'number' && columnUnitSummary?.median !== undefined) {
			return generateImplicitNumberFormat(columnUnitSummary);
		}
	}
	return undefined;
};

/**
 * Formatting logic for formats with formatCode=AUTO_FORMAT_CODE
 * @param {*} typedValue the value to be formatted
 * @param {*} columnFormat the auto formatting description with _autoFormat settings
 * @param {*} columnUnitSummary the summary of units in the column (only applicable to numbered columns)
 * @returns formattedv value
 */
export const autoFormat = (typedValue, columnFormat, columnUnitSummary = undefined) => {
	if (columnFormat._autoFormat?.autoFormatFunction) {
		return columnFormat._autoFormat.autoFormatFunction(typedValue, columnFormat, columnUnitSummary);
	} else if (columnFormat._autoFormat.autoFormatCode) {
		let autoFormatCode = columnFormat?._autoFormat?.autoFormatCode;
		let valueType = columnFormat.valueType;
		if ('number' === valueType) {
			let truncateUnits = columnFormat?._autoFormat?.truncateUnits;

			let unitValue = typedValue;
			let unit = '';

			if (truncateUnits && columnUnitSummary?.median !== undefined) {
				//use of median is a bit detached here. Perhaps _autoFormat.truncateUnits could instead be _autoFormat.columnUnits=k|M|B (already done for default currency)
				//this will affect the auto currency formatting since they simply rely on the median. Perhaps they should be functions instead.
				unit = getAutoColumnUnit(columnUnitSummary.median);
				unitValue = applyColumnUnits(typedValue, unit);
			}
			return ssf.format(autoFormatCode, unitValue) + unit;
		} else {
			return ssf.format(autoFormatCode, typedValue);
		}
	} else {
		console.warn('autoFormat called without a formatCode or function');
	}
	return typedValue;
};

/**
 * Formatting for any column without formatting settings
 * @param {*} typedValue a value of type number|date|string
 * @returns the formatted value
 */
export const fallbackFormat = (typedValue) => {
	if (typeof typedValue === 'number') {
		return typedValue.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		});
	} else if (typedValue !== undefined && typedValue !== null) {
		return typedValue?.toString();
	} else {
		return '-';
	}
};

//TODO: use rewire.js to enable testing without exporting.
/**
 * @param {number} referenceValue
 * @returns {string} the number format code for the given reference value
 */
export function computeNumberAutoFormatCode(
	referenceValue,
	maxDisplayDecimals = 7,
	significantDigits = AUTO_FORMAT_MEDIAN_PRECISION
) {
	let formatCodeBuilder = '#,##0';

	let referenceValueLeadingDigitExponent = base10Exponent(referenceValue);
	let displayDecimals = 0;

	if (referenceValueLeadingDigitExponent - significantDigits < 0) {
		displayDecimals = Math.min(
			Math.max(Math.abs(referenceValueLeadingDigitExponent - significantDigits + 1), 0),
			maxDisplayDecimals
		);
	}

	if (displayDecimals > 0) {
		formatCodeBuilder += '.';
		formatCodeBuilder += '0'.repeat(displayDecimals);
	}

	return formatCodeBuilder;
}

/**
 * @param {number | undefined} value
 * @returns {string} the appropriate unit (B, M, k or '') for the given value
 */
function getAutoColumnUnit(value) {
	let absoluteValue = Math.abs(value);
	if (absoluteValue >= 5000000000000) {
		return 'T';
	} else if (absoluteValue >= 5000000000) {
		return 'B';
	} else if (absoluteValue >= 5000000) {
		return 'M';
	} else if (absoluteValue >= 5000) {
		return 'k';
	} else {
		return '';
	}
}

function base10Exponent(value) {
	if (value === 0) {
		return 0;
	} else {
		return Math.floor(Math.log10(value));
	}
}
