import { AUTO_FORMAT_CODE, applyColumnUnits, generateImplicitNumberFormat } from './autoFormatting';
import ssf from 'ssf';

export const SUPPORTED_CURRENCIES = [
	{
		primaryCode: 'usd',
		currencySymbol: '$',
		displayName: 'USD - United States Dollar'
	},
	{
		primaryCode: 'aud',
		currencySymbol: 'A$',
		displayName: 'AUD - Australian Dollar',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'brl',
		currencySymbol: 'R$',
		displayName: 'BRL - Brazilian Real',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'cad',
		currencySymbol: 'C$',
		displayName: 'CAD - Canadian Dollar',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'cny',
		currencySymbol: '¥',
		displayName: 'CNY - Renminbi',
		escapeCurrencySymbol: true
	},
	{ primaryCode: 'eur', currencySymbol: '€', displayName: 'EUR - Euro' },
	{
		primaryCode: 'gbp',
		currencySymbol: '£',
		displayName: 'GBP - Pound Sterling',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'jpy',
		currencySymbol: '¥',
		displayName: 'JPY - Japanese Yen',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'inr',
		currencySymbol: '₹',
		displayName: 'INR - Indian Rupee',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'krw',
		currencySymbol: '₩',
		displayName: 'KRW - South Korean won',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'ngn',
		currencySymbol: '₦',
		displayName: 'NGN -  Nigerian Naira',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'rub',
		currencySymbol: 'rub',
		displayName: 'RUB - Russian Ruble',
		escapeCurrencySymbol: true
	},
	{
		primaryCode: 'sek',
		currencySymbol: 'kr',
		displayName: 'SEK - Swedish Krona',
		escapeCurrencySymbol: true
	}
];

const DERIVED_CURRENCY_FORMATS = [
	{
		derivedSuffix: '',
		valueFormatCode: '#,##0',
		exampleInput: 412.17,
		auto: true
	},
	{
		derivedSuffix: '0',
		valueFormatCode: '#,##0',
		exampleInput: 7043.123
	},
	{
		derivedSuffix: '1',
		valueFormatCode: '#,##0.0',
		exampleInput: 7043.123
	},
	{
		derivedSuffix: '2',
		valueFormatCode: '#,##0.00',
		exampleInput: 7043.123
	},
	{
		derivedSuffix: '0k',
		valueFormatCode: '#,##0,"k"',
		exampleInput: 64301.12
	},
	{
		derivedSuffix: '1k',
		valueFormatCode: '#,##0.0,"k"',
		exampleInput: 64301.12
	},
	{
		derivedSuffix: '2k',
		valueFormatCode: '#,##0.00,"k"',
		exampleInput: 64301.12
	},
	{
		derivedSuffix: '0m',
		valueFormatCode: '#,##0,,"M"',
		exampleInput: 4564301.12
	},
	{
		derivedSuffix: '1m',
		valueFormatCode: '#,##0.0,,"M"',
		exampleInput: 4564301.12
	},
	{
		derivedSuffix: '2m',
		valueFormatCode: '#,##0.00,,"M"',
		exampleInput: 4564301.12
	},
	{
		derivedSuffix: '0b',
		valueFormatCode: '#,##0,,,"B"',
		exampleInput: 9784564301.12
	},
	{
		derivedSuffix: '1b',
		valueFormatCode: '#,##0.0,,,"B"',
		exampleInput: 9784564301.12
	},
	{
		derivedSuffix: '2b',
		valueFormatCode: '#,##0.00,,,"B"',
		exampleInput: 9784564301.12
	}
];

const CURRENCY_FORMATS = SUPPORTED_CURRENCIES.map((currency) => {
	let derivedFormats = [];
	DERIVED_CURRENCY_FORMATS.forEach((derivedFormat) => {
		let next = {
			formatTag: currency.primaryCode + derivedFormat.derivedSuffix,
			parentFormat: currency.primaryCode,
			formatCategory: 'currency',
			valueType: 'number',
			exampleInput: derivedFormat.exampleInput,
			titleTagReplacement: ` (${currency.currencySymbol})`
		};
		let symbolInFormatCode = currency.escapeCurrencySymbol
			? `"${currency.currencySymbol}"`
			: currency.currencySymbol;
		if (derivedFormat.auto || AUTO_FORMAT_CODE === derivedFormat.formatCode) {
			next.formatCode = AUTO_FORMAT_CODE;
			//TODO This should be fixed so that 1)the format is NOT recomputed for each value, 2)remove some of magic is done to make it look good.
			next._autoFormat = {
				autoFormatFunction: (typedValue, columnFormat, columnUnitSummary) => {
					let format = generateImplicitNumberFormat(columnUnitSummary, 2);
					let effectiveCode = `${symbolInFormatCode}${format._autoFormat.autoFormatCode}`;
					let suffix = '';
					let displayValue = typedValue;
					if (format._autoFormat.truncateUnits && format._autoFormat.columnUnits) {
						suffix = format._autoFormat.columnUnits;
						displayValue = applyColumnUnits(typedValue, format._autoFormat.columnUnits);
					} else {
						if (effectiveCode.endsWith('.0')) {
							effectiveCode = effectiveCode + '0';
						}
					}
					return ssf.format(effectiveCode, displayValue) + suffix;
				}
			};
		} else {
			next.formatCode = `${symbolInFormatCode}${derivedFormat.valueFormatCode}`;
		}
		if (derivedFormat.axisValueFormatCode) {
			next.axisFormatCode = derivedFormat.axisValueFormatCode;
		}
		derivedFormats.push(next);
	});
	return derivedFormats;
}).flat();

export const BUILT_IN_FORMATS = [
	...CURRENCY_FORMATS,
	//auto formats
	// Date/Time:
	{
		formatTag: 'ddd',
		formatCode: 'ddd',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'dddd',
		formatCode: 'dddd',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'mmm',
		formatCode: 'mmm',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'mmmm',
		formatCode: 'mmmm',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'yyyy',
		formatCode: 'yyyy',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'shortdate',
		formatCode: 'mmm d/yy',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'longdate',
		formatCode: 'mmmm d, yyyy',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'fulldate',
		formatCode: 'dddd mmmm d, yyyy',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'mdy',
		formatCode: 'm/d/y',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'dmy',
		formatCode: 'd/m/y',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09 12:45'
	},
	{
		formatTag: 'hms',
		formatCode: 'H:MM:SS AM/PM',
		formatCategory: 'date',
		valueType: 'date',
		exampleInput: '2022-01-09T11:45:03'
	},
	// Numbers:
	{
		formatTag: 'num0',
		formatCode: '#,##0',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 11.23168
	},
	{
		formatTag: 'num1',
		formatCode: '#,##0.0',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 11.23168
	},
	{
		formatTag: 'num2',
		formatCode: '#,##0.00',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 11.23168
	},
	{
		formatTag: 'num3',
		formatCode: '#,##0.000',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 11.23168
	},
	{
		formatTag: 'num4',
		formatCode: '#,##0.0000',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 11.23168
	},
	{
		formatTag: 'num0k',
		formatCode: '#,##0,"k"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 64201
	},
	{
		formatTag: 'num1k',
		formatCode: '#,##0.0,"k"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 64201
	},
	{
		formatTag: 'num2k',
		formatCode: '#,##0.00,"k"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 64201
	},
	{
		formatTag: 'num0m',
		formatCode: '#,##0,,"M"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 42539483
	},
	{
		formatTag: 'num1m',
		formatCode: '#,##0.0,,"M"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 42539483
	},
	{
		formatTag: 'num2m',
		formatCode: '#,##0.00,,"M"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 42539483
	},
	{
		formatTag: 'num0b',
		formatCode: '#,##0,,,"B"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 1384937584
	},
	{
		formatTag: 'num1b',
		formatCode: '#,##0.0,,,"B"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 1384937584
	},
	{
		formatTag: 'num2b',
		formatCode: '#,##0.00,,,"B"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: 1384937584
	},
	{
		formatTag: 'id',
		formatCode: '0',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '921594675',
		titleTagReplacement: ' id'
	},
	{
		formatTag: 'fract',
		formatCode: '# ?/?',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '0.25'
	},
	{
		formatTag: 'mult',
		formatCode: '#,##0.0"x"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '5.32'
	},
	{
		formatTag: 'mult0',
		formatCode: '#,##0"x"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '5.32'
	},
	{
		formatTag: 'mult1',
		formatCode: '#,##0.0"x"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '5.32'
	},
	{
		formatTag: 'mult2',
		formatCode: '#,##0.00"x"',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '5.32'
	},
	{
		formatTag: 'sci',
		formatCode: '0.00E+0',
		formatCategory: 'number',
		valueType: 'number',
		exampleInput: '16546.1561'
	},

	// Percent:
	{
		formatTag: 'pct',
		formatCode: AUTO_FORMAT_CODE,
		formatCategory: 'percent',
		valueType: 'number',
		exampleInput: 0.731,
		titleTagReplacement: '',
		_autoFormat: {
			autoFormatFunction: (typedValue, columnFormat, columnUnitSummary) => {
				if ('number' === columnUnitSummary?.unitType) {
					let adjustedColumnUnitSummary = {
						min: columnUnitSummary.min * 100,
						max: columnUnitSummary.max * 100,
						median: columnUnitSummary.median * 100,
						maxDecimals: Math.max(columnUnitSummary.maxDecimals - 2, 0),
						unitType: columnUnitSummary.unitType
					};
					let format = generateImplicitNumberFormat(adjustedColumnUnitSummary);
					return ssf.format(format._autoFormat.autoFormatCode, typedValue * 100) + '%';
				} else {
					return ssf.format('#,##0%', typedValue);
				}
			}
		}
	},
	{
		formatTag: 'pct0',
		formatCode: '#,##0%',
		formatCategory: 'percent',
		valueType: 'number',
		exampleInput: 0.731,
		titleTagReplacement: ''
	},
	{
		formatTag: 'pct1',
		formatCode: '#,##0.0%',
		formatCategory: 'percent',
		valueType: 'number',
		exampleInput: 0.731,
		titleTagReplacement: ''
	},
	{
		formatTag: 'pct2',
		formatCode: '#,##0.00%',
		formatCategory: 'percent',
		valueType: 'number',
		exampleInput: 0.731,
		titleTagReplacement: ''
	},
	{
		formatTag: 'pct3',
		formatCode: '#,##0.000%',
		formatCategory: 'percent',
		valueType: 'number',
		exampleInput: 0.731,
		titleTagReplacement: ''
	}
];
