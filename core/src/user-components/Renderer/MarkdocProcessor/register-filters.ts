import { type Node, type Config } from '@markdoc/markdoc';
import type { Filters } from '../../../Filters.svelte';
import type { FilterInit } from '../../../Filter.svelte';
import { isUserComponent, getUserComponent } from '../../..';
import isEqual from 'lodash/isEqual';
import type { UserComponentProps, UserComponentSchema } from '../../types';
import { createScopedConfig } from '../../tags/partial/schema';
import { resolvePartialFile, type ReferenceResolutionConfig } from '../../common/resolve-reference';
import { interpolateFrontmatterVariables } from '../../../filter-variables/VariableProcessor';
import {
	extractFilterCreates,
	extractFilterCreatesFromJs
} from '../../tags/html/extract-filter-creates';
import { extractMapSource } from '../../tags/custom_map/extract-map-source';
import { extractHtmlSource } from '../../tags/html/extract-html-source';
import { parseFrontmatter } from '../../../utils/parseFrontmatter';
import type { CustomComponentMeta } from '../../custom-components';

/** Map from `node.location.file` ('' for the page itself) to its source text. */
export type EvidenceSourcesMap = Record<string, string | undefined>;

/**
 * Walks the AST and registers filters for all components that have a Filter class.
 * This ensures filters are always available in the filters store, even if components are
 * inside conditional blocks that aren't currently rendered.
 */
export function registerFiltersFromAST(
	ast: Node,
	filters: Filters,
	partials?: Record<string, Node>,
	variables?: Record<string, unknown>,
	resolution?: ReferenceResolutionConfig | { useRelativeResolution?: boolean; basePath?: string },
	evidenceSources?: EvidenceSourcesMap,
	/**
	 * Custom-component registry meta (tag name → { fullPath, attributes }).
	 * Present only on the page-render path. Lets the walk resolve a custom
	 * component used on the page to its body (in `partials`, keyed by fullPath)
	 * and register any inputs the body defines onto the page — parity with how a
	 * referenced partial's inputs register. Inputs keep their literal id (they
	 * are intentionally page-global, unlike inline queries which are namespaced).
	 */
	componentMeta?: Record<string, CustomComponentMeta>
): void {
	// Build a config object for Markdoc resolution, carrying the project-root
	// reference flags so partial refs resolve to their full-path map keys.
	const config: Config & ReferenceResolutionConfig = {
		partials: partials ?? {},
		variables: variables ?? {},
		evidenceUseRelativeResolution:
			(resolution as ReferenceResolutionConfig)?.evidenceUseRelativeResolution ??
			(resolution as { useRelativeResolution?: boolean })?.useRelativeResolution,
		evidenceBasePath:
			(resolution as ReferenceResolutionConfig)?.evidenceBasePath ??
			(resolution as { basePath?: string })?.basePath
	};

	// First pass: collect all filter IDs that should exist (main AST + referenced partials)
	const expectedFilterIds = new Set<string>();
	collectFilterIds(ast, expectedFilterIds);

	// Static externals declared inside html blocks via `evidence.filters.create`.
	// We treat these as a separate expected set because they're reaped via a
	// different rule (only the static-external subset of #externalIds gets
	// pruned when its source-level call disappears; pure runtime-only externals
	// are owned by their html block's unmount cleanup).
	const expectedStaticExternals = new Map<string, { column?: string }>();
	collectStaticExternalFilters(ast, expectedStaticExternals, evidenceSources, config);

	// Find which partials are actually referenced on this page (and their tag nodes)
	const partialTagNodes = new Map<string, Node>();
	collectPartialTagNodes(ast, partialTagNodes, config);

	// Collect nested partials (partials inside partials)
	if (partials) {
		collectNestedPartials(partials, partialTagNodes, config);
	}

	// Only collect filter IDs from referenced partials
	if (partials) {
		for (const partialName of partialTagNodes.keys()) {
			const partialAst = partials[partialName];
			if (partialAst) {
				collectFilterIds(partialAst, expectedFilterIds);
				collectStaticExternalFilters(partialAst, expectedStaticExternals, evidenceSources, config);
			}
		}
	}

	// Custom components used on the page resolve to their body (in `partials`,
	// keyed by fullPath). Collect the inputs each body defines so they land in
	// the expected set (and aren't reaped) and get registered below — the
	// component-body analog of the referenced-partial handling above. We recurse
	// into component bodies so a component composed of other components (a filter
	// bar built from dropdowns) registers the inputs at every level, matching how
	// `collectNestedPartials` follows partials-inside-partials.
	//
	// Pay-for-what-you-use: only bodies of components actually reached from the
	// page are walked, each exactly once (keyed by fullPath), so a component with
	// no nested components costs a single traversal that finds nothing, and one
	// used N times is walked once.
	const componentTagNodes = new Map<string, Node>();
	if (componentMeta && partials) {
		collectComponentTagNodes(ast, componentMeta, componentTagNodes);
		collectNestedComponentTagNodes(partials, componentMeta, componentTagNodes);
		for (const [fullPath] of componentTagNodes) {
			const body = partials[fullPath];
			if (body) {
				collectFilterIds(body, expectedFilterIds);
				// {% html %} blocks inside the body can declare page filters via
				// evidence.filters.create — slice their source (keyed by the
				// component path in evidenceSources) exactly like partials above.
				// Without this, a JS-created cross-filter inside a component was
				// invisible to validation: charts binding filters="id" errored
				// "does not exist" even though the docs promise the pattern.
				collectStaticExternalFilters(body, expectedStaticExternals, evidenceSources, config);
			}
		}
	}

	// Remove filters that are no longer in the AST or partials. Two cleanup
	// rules layered together:
	//   1. Static external (pre-registered by our html scan): reap if its
	//      source-level call no longer appears in the current AST scan. The
	//      block was edited or deleted, so the filter should go too.
	//   2. Pure runtime external (not statically detected — dynamic id, etc.):
	//      always preserved here. Its owner (the html block) cleans it up on
	//      unmount.
	//   3. AST-tag filter: reap if not in expectedFilterIds. (Today's rule.)
	const currentFilterIds = filters.filterIds;
	for (const filterId of currentFilterIds) {
		if (filters.isExternal(filterId)) {
			if (filters.isStaticExternal(filterId) && !expectedStaticExternals.has(filterId)) {
				filters.remove(filterId);
			}
			continue;
		}
		if (!expectedFilterIds.has(filterId)) {
			filters.remove(filterId);
		}
	}

	// Second pass: register new filters from main AST
	addOrUpdateFilters(ast, filters, config);

	// Third pass: register new filters from referenced partials only
	if (partials) {
		for (const [partialName, partialTagNode] of partialTagNodes) {
			const partialAst = partials[partialName];
			if (partialAst) {
				// Use createScopedConfig to get properly scoped variables for this partial
				// This reuses the same logic as the partial transform
				const scopedConfig = createScopedConfig(partialTagNode, config);
				if (scopedConfig) {
					addOrUpdateFilters(partialAst, filters, scopedConfig);
				}
			}
		}
	}

	// Register filters defined by custom-component bodies used on the page (and,
	// via the recursive collection above, by components nested inside them). Each
	// body's filter attributes resolve against that component's attribute scope
	// (call-site values + declared defaults + body frontmatter), mirroring the
	// component transform, so a filter default like `{{ $someAttr }}` resolves.
	if (componentMeta && partials) {
		for (const [fullPath, componentTagNode] of componentTagNodes) {
			const body = partials[fullPath];
			const meta = componentMeta[componentTagNode.tag as string];
			if (!body || !meta) continue;
			const scopedConfig = createComponentScopedConfig(componentTagNode, meta, body, config);
			addOrUpdateFilters(body, filters, scopedConfig);
		}
	}

	// Fourth pass: pre-register static externals. We do this AFTER AST-tag
	// filter registration so that an AST tag with the same id always wins on
	// collision (createExternal defers to the existing filter), making the
	// builtin filter the canonical one even if a stale html call shadows it.
	for (const [id, { column }] of expectedStaticExternals) {
		filters.createExternal(id, undefined, column, { static: true });
	}
}

function collectComponentTagNodes(
	node: Node,
	componentMeta: Record<string, CustomComponentMeta>,
	out: Map<string, Node>
): void {
	// A custom-component tag: record it keyed by its body's fullPath. First use
	// wins (matches referenced-partial handling — one registration per body).
	if (node.type === 'tag' && node.tag && componentMeta[node.tag]) {
		const { fullPath } = componentMeta[node.tag];
		if (!out.has(fullPath)) out.set(fullPath, node);
	}

	if (node.children) {
		for (const child of node.children) {
			collectComponentTagNodes(child, componentMeta, out);
		}
	}
}

/**
 * Extend `out` (page-level component usages) with components used INSIDE those
 * components' bodies, transitively. The component analog of
 * `collectNestedPartials`. A `processed` set makes each body's walk happen once
 * and breaks include cycles (a component that references itself). Only walks
 * bodies already reached — components not used on the page are never touched.
 */
function collectNestedComponentTagNodes(
	partials: Record<string, Node>,
	componentMeta: Record<string, CustomComponentMeta>,
	out: Map<string, Node>
): void {
	const processed = new Set<string>();
	// Worklist over discovered component bodies. collectComponentTagNodes adds
	// any nested component usages to `out` (first-wins), so we drain until no
	// new bodies appear.
	let frontier = [...out.keys()];
	while (frontier.length > 0) {
		for (const fullPath of frontier) {
			if (processed.has(fullPath)) continue;
			processed.add(fullPath);
			const body = partials[fullPath];
			if (body) collectComponentTagNodes(body, componentMeta, out);
		}
		frontier = [...out.keys()].filter((fullPath) => !processed.has(fullPath));
	}
}

/**
 * Build the config a custom-component body's filters resolve against — its
 * attribute scope, layered lowest-to-highest: page config variables, the
 * body's own frontmatter defaults, declared attribute defaults, then the
 * call-site attribute values. Mirrors the scoped config the component
 * transform builds so filter attributes see the same variables as the rendered
 * body.
 */
function createComponentScopedConfig(
	tagNode: Node,
	meta: CustomComponentMeta,
	body: Node | Node[],
	config: Config
): Config {
	const bodyNode = Array.isArray(body) ? body[0] : body;
	const { frontmatter: bodyFrontmatter } = parseFrontmatter(
		bodyNode?.attributes?.frontmatter as string
	);

	const defaults: Record<string, unknown> = {};
	for (const [name, decl] of Object.entries(meta.attributes)) {
		if (decl.default !== undefined) defaults[name] = decl.default;
	}
	const callSite: Record<string, unknown> = {};
	for (const name of Object.keys(meta.attributes)) {
		if (tagNode.attributes[name] !== undefined) callSite[name] = tagNode.attributes[name];
	}

	return {
		...config,
		variables: {
			...config.variables,
			...bodyFrontmatter,
			...defaults,
			...callSite
		}
	};
}

function collectPartialTagNodes(
	node: Node,
	partialTagNodes: Map<string, Node>,
	config?: ReferenceResolutionConfig
): void {
	// If this is a partial tag, collect the tag node (we need it for createScopedConfig).
	// Key by the resolved full-path map key so it matches `partials[...]` below.
	if (node.type === 'tag' && node.tag === 'partial' && node.attributes.file) {
		const key = resolvePartialFile(node.attributes.file, node, config);
		// Only keep the first occurrence (if same partial included multiple times)
		if (!partialTagNodes.has(key)) {
			partialTagNodes.set(key, node);
		}
	}

	// Recursively collect from children
	if (node.children) {
		for (const child of node.children) {
			collectPartialTagNodes(child, partialTagNodes, config);
		}
	}
}

function collectNestedPartials(
	partials: Record<string, Node>,
	partialTagNodes: Map<string, Node>,
	config?: ReferenceResolutionConfig,
	processedPartials: Set<string> = new Set()
): void {
	for (const [partialName, partialAst] of Object.entries(partials)) {
		if (partialTagNodes.has(partialName) && !processedPartials.has(partialName)) {
			processedPartials.add(partialName);

			// Collect partial tags from within this partial
			collectPartialTagNodes(partialAst, partialTagNodes, config);

			collectNestedPartials(partials, partialTagNodes, config, processedPartials);
		}
	}
}

/**
 * Walk every `{% html %}` tag in `node` and statically extract any
 * `evidence.filters.create("id", …, { column: "col" })` calls inside their
 * `<script>` bodies. The output drives both pre-registration (so editor-time
 * validators see filters declared by author code, not just by AST tags) and
 * cleanup (so a static pre-reg disappears when its source-level call does).
 *
 * First-occurrence wins on duplicate ids across (or within) blocks: the AST
 * walker already guarantees pre-order traversal, so the deterministic
 * "wins" filter is the lexically-first one. Subsequent calls with the same id
 * collide at runtime under the existing `createExternal` deferral rule.
 */
function collectStaticExternalFilters(
	node: Node,
	out: Map<string, { column?: string }>,
	evidenceSources: EvidenceSourcesMap | undefined,
	config: Config
): void {
	if (node.type === 'tag' && node.tag === 'html') {
		const body = readHtmlBody(node, evidenceSources, config);
		if (typeof body === 'string' && body.length > 0) {
			for (const created of extractFilterCreates(body)) {
				if (out.has(created.id)) continue;
				out.set(created.id, { column: created.column });
			}
		}
	} else if (node.type === 'tag' && node.tag === 'custom_map') {
		// custom_map's body is pure JS (no <script> wrapper), so scan it directly.
		const body = readMapBody(node, evidenceSources, config);
		if (typeof body === 'string' && body.length > 0) {
			for (const created of extractFilterCreatesFromJs(body)) {
				if (out.has(created.id)) continue;
				out.set(created.id, { column: created.column });
			}
		}
	}
	if (node.children) {
		for (const child of node.children) {
			collectStaticExternalFilters(child, out, evidenceSources, config);
		}
	}
}

/**
 * Recover the html block's body text. We try the post-transform `html`
 * attribute first (cheap and always populated when the AST has been
 * transformed) and fall back to slicing the document source via
 * `extractHtmlSource` (the path used during parse, before transform —
 * `registerFiltersFromAST` runs in this phase). Returns undefined if neither
 * route can supply text; the caller treats that as "no static pre-reg, runtime
 * path takes over".
 */
function readHtmlBody(
	node: Node,
	evidenceSources: EvidenceSourcesMap | undefined,
	config: Config
): string | undefined {
	const attr = node.attributes?.html;
	if (typeof attr === 'string') return attr;
	if (!evidenceSources) return undefined;
	return extractHtmlSource(node, {
		...config,
		evidenceSources
	} as Config & { evidenceSources: EvidenceSourcesMap });
}

/**
 * Recover the custom_map block's JS body — the post-transform `code` attribute
 * first, else slice the document source via `extractMapSource` (the parse-phase
 * path, before transform). Mirrors `readHtmlBody`.
 */
function readMapBody(
	node: Node,
	evidenceSources: EvidenceSourcesMap | undefined,
	config: Config
): string | undefined {
	const attr = node.attributes?.code;
	if (typeof attr === 'string') return attr;
	if (!evidenceSources) return undefined;
	return extractMapSource(node, {
		...config,
		evidenceSources
	} as Config & { evidenceSources: EvidenceSourcesMap });
}

function collectFilterIds(node: Node, filterIds: Set<string>): void {
	// If this is a user component with a Filter class, collect its filter ID
	if (node.type === 'tag' && node.tag && isUserComponent(node.tag)) {
		const userComponent = getUserComponent(node.tag);
		if (userComponent.Filter && node.attributes.id && typeof node.attributes.id === 'string') {
			filterIds.add(node.attributes.id);
		}
	}

	// Recursively collect from children
	if (node.children) {
		for (const child of node.children) {
			collectFilterIds(child, filterIds);
		}
	}
}

function addOrUpdateFilters(node: Node, filters: Filters, config: Config): void {
	// If this is a user component with a Filter class, update or create a filter for it
	if (node.type === 'tag' && node.tag && isUserComponent(node.tag)) {
		const userComponent = getUserComponent(node.tag);
		if (userComponent.Filter && node.attributes.id && typeof node.attributes.id === 'string') {
			const filter = filters.get(node.attributes.id);

			// Resolve the node to get attributes with variables resolved
			const resolvedNode = node.resolve(config);
			let resolvedAttributes = resolvedNode.attributes;

			// Also handle {{ $var }} syntax in initial_value strings
			const variables = (config.variables ?? {}) as Record<string, unknown>;
			if (
				typeof resolvedAttributes.initial_value === 'string' &&
				resolvedAttributes.initial_value.includes('{{')
			) {
				resolvedAttributes = {
					...resolvedAttributes,
					initial_value: interpolateFrontmatterVariables(
						resolvedAttributes.initial_value,
						variables
					)
				};
			}

			if (filter) {
				const shouldApplyInitialValue =
					filter.value === undefined &&
					(['initial_value', 'initial_values'] as const).some(
						(attribute) =>
							resolvedAttributes[attribute] !== undefined &&
							!isEqual(filter.attributes[attribute], resolvedAttributes[attribute])
					);

				if (shouldApplyInitialValue) {
					filters.remove(node.attributes.id);
					const init: Omit<
						FilterInit<string, UserComponentProps<UserComponentSchema>>,
						'url'
					> = {
						id: node.attributes.id,
						userComponentName: node.tag,
						attributes: resolvedAttributes
					};
					filters.create(init, userComponent.Filter);
				} else if (!isEqual(filter.attributes, resolvedAttributes)) {
					filter.attributes = resolvedAttributes;
				}
			} else {
				const init: Omit<FilterInit<string, UserComponentProps<UserComponentSchema>>, 'url'> = {
					id: node.attributes.id,
					userComponentName: node.tag,
					attributes: resolvedAttributes
				};
				filters.create(init, userComponent.Filter);
			}
		}
	}

	// Recursively walk children
	if (node.children) {
		for (const child of node.children) {
			addOrUpdateFilters(child, filters, config);
		}
	}
}
