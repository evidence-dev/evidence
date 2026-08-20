import type { Config, Node } from '@markdoc/markdoc';

type ConfigWithSources = Config & { evidenceSources?: Record<string, string | undefined> };

/**
 * Recovers the tag body's raw text — the author's HTML+JS — by slicing the
 * document source at the children's line range. Markdoc parses the body as
 * markdown (HTML blocks, paragraphs), which can't reproduce the exact text
 * (and would mangle `<script>` content), so we go back to the source itself
 * (threaded through the config as `evidenceSources` by process-markdoc).
 *
 * Returns '' for an empty body and undefined when the source text isn't
 * available (callers should treat that as "can't check", not an error).
 */
export function extractHtmlSource(node: Node, config: Config): string | undefined {
	if (node.children.length === 0) return '';

	const source = (config as ConfigWithSources).evidenceSources?.[node.location?.file ?? ''];
	if (typeof source !== 'string') return undefined;

	const start = Math.min(...node.children.map((child) => child.location?.start.line ?? Infinity));
	const end = Math.max(...node.children.map((child) => child.location?.end.line ?? -Infinity));
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;

	return source.split('\n').slice(start, end).join('\n');
}
