import JSON5 from 'json5';

export type ParsedCustomEchartConfig =
	| { config: Record<string, unknown>; error?: undefined }
	| { config?: undefined; error: string };

/**
 * Parses the tag body into an ECharts option object.
 * JSON5 instead of JSON so configs copy-pasted from ECharts docs (unquoted
 * keys, single quotes, trailing commas, comments) work as-is.
 */
export function parseCustomEchartConfig(source: string | undefined): ParsedCustomEchartConfig {
	if (!source?.trim()) {
		return {
			error: 'Add the ECharts config as a JSON object in the tag body.'
		};
	}

	let parsed: unknown;
	try {
		parsed = JSON5.parse(source);
	} catch (e) {
		return { error: e instanceof Error ? e.message : 'Invalid JSON' };
	}

	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return { error: 'Config must be a JSON object, e.g. { "series": [{ "type": "bar" }] }' };
	}

	return { config: parsed as Record<string, unknown> };
}
