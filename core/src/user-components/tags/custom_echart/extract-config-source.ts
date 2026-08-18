import type { Config, Node } from '@markdoc/markdoc';

type ConfigWithSources = Config & { evidenceSources?: Record<string, string | undefined> };

/**
 * Recovers the tag body's raw text — the user's ECharts config — by slicing
 * the document source at the children's line range. The body is parsed by
 * markdoc as markdown (paragraphs etc.), which can't reproduce the text
 * faithfully, so we go back to the source itself (threaded through the config
 * as evidenceSources by process-markdoc).
 *
 * Returns '' for an empty body and undefined when the source text isn't
 * available (callers should treat that as "can't check" rather than an error).
 */
export function extractConfigSource(node: Node, config: Config): string | undefined {
	// A fenced body also works (it carries its own exact text) — agents and
	// OSS users habitually wrap config in ```json fences
	const fence = node.children.find((child) => child.type === 'fence');
	if (fence && typeof fence.attributes?.content === 'string') return fence.attributes.content;

	if (node.children.length === 0) return '';

	const source = (config as ConfigWithSources).evidenceSources?.[node.location?.file ?? ''];
	if (typeof source !== 'string') return undefined;

	const start = Math.min(...node.children.map((child) => child.location?.start.line ?? Infinity));
	const end = Math.max(...node.children.map((child) => child.location?.end.line ?? -Infinity));
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;

	return source.split('\n').slice(start, end).join('\n');
}
