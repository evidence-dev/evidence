import type { Node, Config, RenderableTreeNode } from '@markdoc/markdoc';
import { partialFileExists, partialCircularReference, and } from '../../validators';
import type { UserComponentSchema } from '../../types';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
import { parseFrontmatter } from '../../../utils/parseFrontmatter';
import { TRANSLATIONS_KEY } from '../../../constants/variable-keys';
import { resolvePartialFile } from '../../common/resolve-reference';
import { stampCallSiteOnRenderable } from '../../common/call-site-stamp';

export const variablesAttribute = {
	type: ZodAttribute.create(z.object({}))
};

interface ExtendedConfig extends Config {
	callStack?: Set<string>;
}

// Prepend an include-site prefix to every `data-heading-id` in the tree so the
// same partial rendered at multiple call sites produces unique ids. Nested
// partials compose: the inner partial prefixes first, the outer wraps around
// it, e.g. `outerLine-outerChar/innerLine-innerChar/file::0-0`.
function prefixHeadingIds(nodes: RenderableTreeNode | RenderableTreeNode[], prefix: string): void {
	if (nodes == null || typeof nodes !== 'object') return;
	if (Array.isArray(nodes)) {
		for (const n of nodes) prefixHeadingIds(n, prefix);
		return;
	}
	const tag = nodes as { attributes?: Record<string, unknown>; children?: RenderableTreeNode[] };
	if (tag.attributes && typeof tag.attributes['data-heading-id'] === 'string') {
		tag.attributes['data-heading-id'] = `${prefix}/${tag.attributes['data-heading-id']}`;
	}
	if (tag.children) prefixHeadingIds(tag.children, prefix);
}

// Extract the transform logic into a separate function for testing
export function createScopedConfig(node: Node, config: Config): Config | null {
	const { partials = {} } = config;
	const { variables } = node.attributes;
	const file = resolvePartialFile(node.attributes.file, node, config);
	const partial: Node | Node[] = partials[file];

	if (!partial) return null;

	// Extract frontmatter variables from the partial itself
	const partialNode = Array.isArray(partial) ? partial[0] : partial;
	const { frontmatter: partialVariables } = parseFrontmatter(
		partialNode?.attributes?.frontmatter as string
	);

	// Create scoped config with partial's variables, passed variables, and translations
	// NOTE: frontmatter variables must be explictly passed to the partial to be available
	// NOTE: translations are always inherited, as they cannot be overridden per partial
	const parentTranslations = config.variables?.[TRANSLATIONS_KEY];
	return {
		...config,
		variables: {
			...partialVariables,
			...variables,
			...(parentTranslations && { [TRANSLATIONS_KEY]: parentTranslations })
		}
	};
}

export const schema = {
	render: 'partial',
	category: 'ui',
	description:
		'Use a reusable partial to render a section of content. Create a partial in the page sidebar of your project.',
	inline: false,
	selfClosing: true,
	validate: and(partialFileExists('file'), partialCircularReference()),
	attributes: {
		file: {
			type: String,
			render: false,
			required: true,
			description:
				'Path to the partial to render. Leading slash means "from the project root" (recommended, e.g. `/partials/header`); without slash, the path resolves relative to the referencing page\'s directory.',
			suggestionType: 'partial'
		},
		variables: {
			type: variablesAttribute.type,
			description:
				'Variables to pass to the partial, must be variables from frontmatter or hardcoded values.',
			render: false,
			required: false
		}
	},
	componentWrapper: false,
	transform(node: Node, config: Config) {
		const file = resolvePartialFile(node.attributes.file, node, config);

		const hasCircularRefError = node.errors.some((error) => error.id === 'circular-reference');
		if (hasCircularRefError) {
			return null;
		}
		const extendedConfig = config as ExtendedConfig;

		if (!extendedConfig.callStack) {
			extendedConfig.callStack = new Set<string>();
		}

		if (extendedConfig.callStack.has(file)) {
			return null;
		}

		extendedConfig.callStack.add(file);

		try {
			const scopedConfig = createScopedConfig(node, config);
			if (!scopedConfig) return null;

			const { partials = {} } = config;
			const partial: Node | Node[] = partials[file];

			const transformChildren = (part: Node) =>
				part.resolve(scopedConfig).transformChildren(scopedConfig);

			const result = Array.isArray(partial)
				? partial.flatMap(transformChildren)
				: transformChildren(partial);

			const start = node.location?.start;
			if (start) {
				prefixHeadingIds(result, `${start.line}-${start.character ?? 0}`);
			}

			// Inlined nodes carry the PARTIAL file's parse coordinates;
			// cmd+click-to-source needs the caller's. See call-site-stamp.ts.
			stampCallSiteOnRenderable(result, node);

			return result;
		} finally {
			extendedConfig.callStack.delete(file);
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% partial file="my_partial" /%}
`
		},
		{
			title: 'Passing Variables from Frontmatter',
			example: `
{% partial file="my_partial" variables={
	my_category=$category
} /%}
`
		},
		{
			title: 'Passing Hardcoded Values',
			example: `
{% partial file="my_partial" variables={
	my_category="Home"
	sales_threshold=10000
} /%}
`
		}
	]
} as const satisfies UserComponentSchema;
