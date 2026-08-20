import { formatValue } from '../../formatValue';

const FORMATTER_KEYS = new Set(['formatter', 'valueFormatter']);
const FMT_PREFIX = 'fmt:';

type UnknownRecord = Record<string, unknown>;

/**
 * Shape of the params object echarts passes to series label/tooltip formatters.
 * With dataset+encode, `value` is the full data item (object or array), so the
 * formatted dimension has to be resolved through `encode`/`dimensionNames`.
 */
type CallbackParams = {
	value?: unknown;
	encode?: Record<string, number[]>;
	dimensionNames?: string[];
	// Present on tooltip params; used to rebuild axis-trigger tooltips
	marker?: string;
	seriesName?: string;
	axisValueLabel?: string;
};

const isCallbackParams = (input: unknown): input is CallbackParams =>
	typeof input === 'object' && input !== null && 'value' in input;

function extractValue(input: unknown): unknown {
	if (!isCallbackParams(input)) return input;

	const { value, encode = {}, dimensionNames = [] } = input;
	if (value === null || typeof value !== 'object') return value;

	// Prefer the series' primary value dimension: y for cartesian, value for
	// pie/funnel/gauge-style series, then x (horizontal bars encode value on x)
	for (const axis of ['y', 'value', 'x']) {
		const dimensionIndex = encode[axis]?.[0];
		if (dimensionIndex === undefined) continue;
		if (Array.isArray(value)) return value[dimensionIndex];
		const dimensionName = dimensionNames[dimensionIndex];
		if (dimensionName !== undefined) return (value as UnknownRecord)[dimensionName];
	}

	return undefined;
}

function formatScalar(value: unknown, formatCode: string): string {
	if (value === null || value === undefined) return '';
	return formatValue(value, formatCode);
}

function makeFormatter(formatCode: string): (input: unknown) => string {
	return (input: unknown) => {
		// Axis-trigger tooltips call the formatter once with an array of params
		// (one per series). A single format code can't render the whole tooltip,
		// so rebuild echarts' default layout — axis-label header plus one
		// marker/name/value row per series — formatting each value. Rows whose
		// value is null/undefined are skipped (common with the dataset+encode
		// pattern, where each series only has data on some categories).
		if (Array.isArray(input)) {
			const params = input as CallbackParams[];
			const header = params[0]?.axisValueLabel ?? '';
			const rows = params
				.map((param) => {
					const formatted = formatScalar(extractValue(param), formatCode);
					if (!formatted) return '';
					return `${param.marker ?? ''}${param.seriesName ? `${param.seriesName}: ` : ''}${formatted}`;
				})
				.filter(Boolean);
			return [header, ...rows].filter(Boolean).join('<br/>');
		}
		return formatScalar(extractValue(input), formatCode);
	};
}

/**
 * Replaces "fmt:<code>" strings on formatter/valueFormatter keys with real
 * formatter functions wrapping Evidence's formatValue. This is the only way to
 * reach function-only echarts options (e.g. tooltip.valueFormatter) from a
 * declarative config, and it never executes user-provided code — the user only
 * names a format code.
 */
export function applyFormatCodes<T>(config: T): T {
	if (Array.isArray(config)) {
		return config.map((item) => applyFormatCodes(item)) as T;
	}
	if (config === null || typeof config !== 'object') return config;

	return Object.fromEntries(
		Object.entries(config as UnknownRecord).map(([key, value]) => {
			if (
				FORMATTER_KEYS.has(key) &&
				typeof value === 'string' &&
				value.startsWith(FMT_PREFIX) &&
				value.length > FMT_PREFIX.length
			) {
				return [key, makeFormatter(value.slice(FMT_PREFIX.length))];
			}
			return [key, applyFormatCodes(value)];
		})
	) as T;
}
