import type { Node, Config, Schema, ConfigType, ValidationError } from '@markdoc/markdoc';
import type { UserComponent, UserComponentAttribute } from '../types';
import { parseFrontmatter } from '../../utils/parseFrontmatter';
import {
	parseCustomComponentAttributesWithErrors,
	type CustomComponentAttributeDeclaration
} from './component-attribute-schema';
import { buildMarkdocAttribute } from './attribute-types';
import {
	applyInstanceScopeToRenderable,
	componentQueriesUseDollarVariables,
	instanceKeyForCallSite,
	collectLocalQueryNames
} from './namespace-component-queries';
import { tableExists } from '../validators';
import { VariableProcessor } from '../../filter-variables/VariableProcessor';
import type { Filters } from '../../Filters.svelte';
import type { InlineQueries } from '../common/inline-queries';
import { stampCallSiteOnRenderable } from '../common/call-site-stamp';
import { SLOT_PLACEHOLDER } from '../tags/slot/schema';
import Markdoc, { type RenderableTreeNode, type Tag } from '@markdoc/markdoc';

interface ExtendedConfig extends Config {
	callStack?: Set<string>;
}

/**
 * Guard against validation cycles (component A's body uses B, B's body uses
 * A). Module-level is safe: Markdoc validation is synchronous, so the stack
 * is empty between top-level validate() calls.
 */
const bodyValidationStack = new Set<string>();

/**
 * How many body errors to re-emit per call site. A badly broken component
 * would otherwise bury the page in duplicated squiggles; the first few plus
 * a count are enough of a breadcrumb to open the file.
 */
const MAX_PROPAGATED_BODY_ERRORS = 3;

/**
 * Validate a component's BODY and re-emit its errors at the call site.
 *
 * Without this, a page that uses a broken component validates green: the
 * body is only validated when its own file is open, so the author sees a
 * blank/broken region with no breadcrumb to the component file, and the AI
 * chat's edit_page validation of the page misses it entirely (battle-test
 * finding). Runs Markdoc.validate over the already-parsed body with the SAME
 * config + context the page uses, so every tag/fence validator (missing
 * columns, bad tables, order guards, …) fires with full metadata.
 *
 * Two deliberate scopes:
 *   - Only `level: 'error'` propagates — warnings stay on the component file
 *     (they'd double as noise on every call site).
 *   - `invalid-table` errors naming the component's OWN scoped queries are
 *     dropped: the body in `config.partials` is post-namespacing, so its
 *     `data="tag:query"` refs are internal and always resolve at render;
 *     tableExists can't know that (scoped names are deliberately excluded
 *     from its public-name lookup).
 *
 * This is an interim, self-contained pass: the unified-validate workstream
 * owns transitive validation long-term, and the file:line attribution here
 * matches the shape it will standardize. Keep dependencies pointed AT this
 * function, never out of it.
 */
function componentBodyErrorsAtCallSite(
	meta: CustomComponentMeta,
	node: Node,
	config: Config,
	context?: unknown
): ValidationError[] {
	const body = config.partials?.[meta.fullPath];
	if (!body || Array.isArray(body)) return [];
	if (bodyValidationStack.has(meta.fullPath)) return [];
	bodyValidationStack.add(meta.fullPath);
	try {
		const bodyErrors = Markdoc.validate(body, config, context);
		const ownScopedNames = collectLocalQueryNames(body);

		// Filter references are only decidable HERE: the body's
		// `{{ region.value }}` couples to whatever inputs the PAGE has, so the
		// standalone file suppresses the check and every call site runs it
		// against this page's actual filter set (registered during parse,
		// before validation). The body's own scoped query refs are neutralized
		// first — they resolve at render, but the filter validator would read
		// an unregistered `{{ tag:query }}` as a missing filter.
		const filterErrors: ValidationError[] = [];
		const ctx = context as { filters?: Filters; inlineQueries?: InlineQueries } | undefined;
		if (ctx?.filters && ctx?.inlineQueries) {
			const processor = new VariableProcessor(ctx.filters, ctx.inlineQueries);
			const seen = new Set<string>();
			const walkFences = (n: Node): void => {
				if (n.type === 'fence' && typeof n.attributes?.content === 'string') {
					const neutralized = (n.attributes.content as string).replace(
						/\{\{([^{}]+)\}\}/g,
						(full, inner: string) => {
							const token = inner.split('|')[0].trim();
							return ownScopedNames.has(token) ? '(select 1)' : full;
						}
					);
					for (const err of processor.validateString(neutralized, { location: n.location })) {
						const line = (n.lines?.[0] ?? n.location?.start?.line ?? 0) + 1;
						const key = `${err.message}:${line}`;
						if (seen.has(key)) continue;
						seen.add(key);
						filterErrors.push({
							id: 'component-filter-not-on-page',
							level: 'error' as const,
							message: `${meta.tagName}: ${err.message} (${meta.fullPath}:${line}). The component's SQL references a page input this page doesn't have — add the input to the page, declare it inside the component body, or pass the value through an attribute (attr="{{ <filter>.value }}").`,
							location: node.location
						});
					}
				}
				for (const child of n.children ?? []) walkFences(child);
			};
			walkFences(body);
		}

		const propagated = bodyErrors
			.filter((e) => e.error?.level === 'error')
			.filter(
				(e) =>
					e.error.id !== 'invalid-table' ||
					![...ownScopedNames].some((name) => e.error.message?.includes(`"${name}"`))
			)
			// A variable-bearing attribute value resolves at RUNTIME through the
			// component's variable processing — Markdoc's enum/type check against
			// it is a guaranteed false positive in BOTH spellings: the template
			// string form shows `Got '{{$tone}}'`, and the unquoted `type=$tone`
			// form reaches the check as an unresolved Ast.Variable — Markdoc's
			// validate never resolves variables — showing `Got '[object Object]'`.
			// (The docs' own warning_box example trips the first form.)
			.filter(
				(e) =>
					!(
						(e.error.id === 'attribute-value-invalid' || e.error.id === 'attribute-type-invalid') &&
						/Got '([^']*\{\{|\[object Object\])/.test(e.error.message ?? '')
					)
			);
		if (propagated.length === 0 && filterErrors.length === 0) return [];

		const errors: ValidationError[] = propagated.slice(0, MAX_PROPAGATED_BODY_ERRORS).map((e) => {
			const line = (e.lines?.[0] ?? e.location?.start?.line ?? 0) + 1;
			return {
				id: 'component-body-error',
				level: 'error' as const,
				message: `${meta.tagName}: ${e.error.message} (${meta.fullPath}:${line})`,
				location: node.location
			};
		});
		const remaining = propagated.length - MAX_PROPAGATED_BODY_ERRORS;
		if (remaining > 0) {
			errors.push({
				id: 'component-body-error',
				level: 'error' as const,
				message: `${meta.tagName}: ${remaining} more error${remaining === 1 ? '' : 's'} in ${meta.fullPath} — open the file to see all of them.`,
				location: node.location
			});
		}
		return [...errors, ...filterErrors];
	} finally {
		bodyValidationStack.delete(meta.fullPath);
	}
}

/**
 * Tag-name conventions:
 * - Tag name = file slug (basename, no extension) — e.g. `components/my_bar.md`
 *   becomes `{% my_bar /%}`.
 * - Nested components (e.g. `components/charts/bar.md`) collapse to their
 *   basename for the tag name. Authors who want different tags from nested
 *   files should keep filenames unique; we surface a collision diagnostic
 *   rather than silently merging behaviours.
 */
export function tagNameForComponentPath(fullPath: string): string {
	const slash = fullPath.lastIndexOf('/');
	const basename = slash === -1 ? fullPath : fullPath.slice(slash + 1);
	// Maps are keyed extensionless by convention, but agent-authored overlay
	// paths legitimately arrive as `components/x.md` — without stripping, the
	// tag registers as `x.md` and `{% x %}` reports tag-undefined even though
	// the file is right there in the map (pending-preview bug).
	return basename.replace(/\.md$/, '');
}

/**
 * Translate an author-declared attribute (parsed frontmatter shape) into a
 * Markdoc attribute schema. Delegated to the registry — adding a new
 * attribute kind is one entry in `ATTRIBUTE_TYPES`, no switch to update
 * here.
 */
function attributeFromDeclaration(
	decl: CustomComponentAttributeDeclaration
): UserComponentAttribute {
	return buildMarkdocAttribute(decl.type, {
		required: decl.required,
		default: decl.default,
		description: decl.description,
		options: decl.options
	});
}

export type CustomComponentMeta = {
	tagName: string;
	fullPath: string;
	description?: string;
	attributes: Record<string, CustomComponentAttributeDeclaration>;
	frontmatterErrors: string[];
	/**
	 * Slot declarations found in the body, or null when the body renders no
	 * {% slot %} tags. Container-ness is INFERRED from the body — the presence
	 * of a slot is the single source of truth for whether the tag accepts
	 * children, so there's no frontmatter flag to drift out of sync.
	 */
	slots: { hasDefault: boolean; names: string[] } | null;
};

/**
 * Find the body's `{% slot %}` declarations by scanning the source text.
 * Text-level on purpose: the registry builds from raw content (bodies parse
 * later, per render), and a slot tag is an explicitly-delimited token that
 * can't be confused with prose. A literal "{% slot %}" inside an {% html %}
 * body could false-positive — the cost is just `selfClosing: false` on a tag
 * that ignores children, which is harmless.
 */
function detectSlots(content: string): CustomComponentMeta['slots'] {
	const names: string[] = [];
	let hasDefault = false;
	for (const match of content.matchAll(/\{%\s*slot\b([^%]*)%\}/g)) {
		const nameMatch = match[1].match(/name\s*=\s*"([^"]+)"/);
		if (nameMatch) names.push(nameMatch[1]);
		else hasDefault = true;
	}
	if (!hasDefault && names.length === 0) return null;
	return { hasDefault, names };
}

/**
 * Pull the `attributes:` block + `description:` out of a component file's
 * frontmatter, returning a normalised meta object. Used both to build the
 * Markdoc schema and to surface attribute info to the editor (autocomplete,
 * "view component" panel, AI tool context).
 */
export function parseCustomComponentMeta(fullPath: string, content: string): CustomComponentMeta {
	const tagName = tagNameForComponentPath(fullPath);
	const frontmatterErrors: string[] = [];

	// `\r?\n` so a component committed with Windows CRLF line endings still has
	// its frontmatter (and therefore its attribute schema) parsed. Markdoc's own
	// parse path tolerates CRLF; this out-of-band extraction must too.
	const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const rawFrontmatter = fmMatch?.[1];
	const { frontmatter, errors } = parseFrontmatter(rawFrontmatter);
	for (const e of errors) {
		frontmatterErrors.push(e.error.message);
	}

	const description =
		typeof frontmatter.description === 'string' ? frontmatter.description : undefined;

	const { attributes, errors: attributeErrors } = parseCustomComponentAttributesWithErrors(
		frontmatter.attributes
	);
	frontmatterErrors.push(...attributeErrors.map((e) => e.message));

	// A preview: entry for an attribute that doesn't exist is always a typo —
	// it silently does nothing (preview values only apply by declared name).
	if (frontmatter.preview && typeof frontmatter.preview === 'object') {
		for (const key of Object.keys(frontmatter.preview as Record<string, unknown>)) {
			if (!(key in attributes)) {
				frontmatterErrors.push(
					`preview.${key} does not match any declared attribute (declared: ${
						Object.keys(attributes).join(', ') || 'none'
					})`
				);
			}
		}
	}

	return {
		tagName,
		fullPath,
		description,
		attributes,
		frontmatterErrors,
		slots: detectSlots(content)
	};
}

/**
 * Build a Markdoc tag schema for a single custom component. The schema's
 * `transform()` resolves the parsed component body (carried in
 * `config.partials`) and substitutes attribute values as Markdoc variables —
 * so a body author writes `$y` / `$data` / `{{ $title }}` exactly as they
 * would inside a partial's `variables={...}` call.
 *
 * Implementation mirrors the partial tag (call-stack guard, scoped variables,
 * `transformChildren` over the inner AST) but the source of variables is the
 * call-site attribute values, not an explicit `variables={...}` map.
 */
export function buildCustomComponentTag(meta: CustomComponentMeta): Schema {
	const attributes: Record<string, UserComponentAttribute> = {};
	for (const [name, decl] of Object.entries(meta.attributes)) {
		attributes[name] = attributeFromDeclaration(decl);
	}

	return {
		render: meta.tagName,
		description: meta.description ?? `Custom component: ${meta.fullPath}`,
		attributes,
		// A body that renders {% slot %} makes the tag a container — children
		// are legal and flow to the slot(s). Without a slot, children have
		// nowhere to go, so the tag stays self-closing-only.
		selfClosing: !meta.slots,
		inline: false,
		validate(node: Node, config: Config, context?: unknown): ValidationError[] {
			const errors: ValidationError[] = [];
			// Surface frontmatter parse failures at the call site so they're
			// visible in the editor squiggle layer, not just the file itself.
			for (const message of meta.frontmatterErrors) {
				errors.push({
					id: 'invalid-component-frontmatter',
					level: 'warning',
					message: `Custom component "${meta.tagName}" has invalid frontmatter: ${message}`,
					location: node.location
				});
			}
			// Teach the slot contract at the call site: children on a slotless
			// component silently vanish, and a fill naming a slot that doesn't
			// exist silently vanishes — both must error with the fix.
			if (!meta.slots && node.children.length > 0) {
				errors.push({
					id: 'component-has-no-slot',
					level: 'error',
					message: `"${meta.tagName}" does not accept children — its body has no {% slot /%}. Use {% ${meta.tagName} /%} (self-closing), or add {% slot /%} to ${meta.fullPath} where the children should render.`,
					location: node.location
				});
			}
			if (meta.slots) {
				for (const child of node.children) {
					if (child.type !== 'tag' || child.tag !== 'fill') continue;
					const slotName = child.attributes.slot;
					if (typeof slotName === 'string' && !meta.slots.names.includes(slotName)) {
						const known = meta.slots.names.length
							? `Named slots: ${meta.slots.names.map((n) => `"${n}"`).join(', ')}.`
							: 'It only has an unnamed default slot — put the content directly between the component tags, without {% fill %}.';
						errors.push({
							id: 'unknown-slot-name',
							level: 'error',
							message: `"${meta.tagName}" has no slot named "${slotName}". ${known}`,
							location: child.location ?? node.location
						});
					}
				}
			}
			// A declared `type: query` attribute is a table/query reference by
			// contract — give it the same call-site existence check as a
			// built-in `data=` (tableExists handles variables, sql-file paths,
			// public inline names, and unloaded metadata itself).
			for (const [name, decl] of Object.entries(meta.attributes)) {
				if (decl.type === 'query') {
					errors.push(...tableExists(name)(node, config, context));
				}
			}
			// Surface the body's own errors here too — a page using a broken
			// component must not validate green (see the function's doc).
			errors.push(...componentBodyErrorsAtCallSite(meta, node, config, context));
			return errors;
		},
		transform(node: Node, config: Config) {
			const extendedConfig = config as ExtendedConfig;
			if (!extendedConfig.callStack) extendedConfig.callStack = new Set<string>();

			// Re-using the partial's circular-include guard: the component body
			// lives in `config.partials` under its full project-root path, so a
			// component that includes itself (or a cycle through other
			// components) stops at the first re-entry instead of stack-blowing.
			if (extendedConfig.callStack.has(meta.fullPath)) return null;
			extendedConfig.callStack.add(meta.fullPath);

			try {
				const partials = config.partials ?? {};
				const body: Node | Node[] | undefined = partials[meta.fullPath];
				if (!body) return null;

				const bodyNode = Array.isArray(body) ? body[0] : body;
				const { frontmatter: bodyFrontmatter } = parseFrontmatter(
					bodyNode?.attributes?.frontmatter as string
				);

				// Layering rules (highest priority last):
				//   1. component frontmatter `attributes.<name>.default` (declared)
				//   2. body frontmatter top-level keys (so an author can write
				//      `data: orders` directly in the body to set a default)
				//   3. call-site attribute values from `node.attributes`
				// Translations + account variables are inherited verbatim so a
				// custom component body can still `{{ $translations.welcome }}`.
				const defaults: Record<string, unknown> = {};
				for (const [name, decl] of Object.entries(meta.attributes)) {
					if (decl.default !== undefined) defaults[name] = decl.default;
				}
				const callSite: Record<string, unknown> = {};
				for (const name of Object.keys(meta.attributes)) {
					if (node.attributes[name] !== undefined) callSite[name] = node.attributes[name];
				}

				const scopedConfig: ConfigType = {
					...config,
					variables: {
						...(config.variables ?? {}),
						...bodyFrontmatter,
						...defaults,
						...callSite
					}
				};

				const transformChild = (part: Node) =>
					part.resolve(scopedConfig).transformChildren(scopedConfig);

				let output: RenderableTreeNode | RenderableTreeNode[] = Array.isArray(body)
					? body.flatMap(transformChild)
					: transformChild(body);

				// Route call-site children into the body's slots. Children
				// transform with the CALLER's config — they're authored in the
				// caller's scope, so their queries, inputs, and $variables are
				// the caller's, not the component's.
				if (meta.slots) {
					// {% fill %} written inline (same line as its content) parses
					// INSIDE a paragraph, not as a direct child — collect fills at
					// any depth, but never through another tag: a nested component
					// (or any container tag) owns its own fills. The default-slot
					// content is simply ALL children transformed — fill's own
					// transform renders null, so filled content doesn't leak into
					// the default slot, and the shared AST is never mutated (the
					// processor may re-transform the same AST reactively).
					const fillNodes: Node[] = [];
					const collectFills = (nodes: Node[]) => {
						for (const child of nodes) {
							if (child.type === 'tag') {
								if (child.tag === 'fill') fillNodes.push(child);
								continue;
							}
							collectFills(child.children ?? []);
						}
					};
					collectFills(node.children);

					const namedFills = new Map<string, RenderableTreeNode[]>();
					for (const fill of fillNodes) {
						const slotName = typeof fill.attributes.slot === 'string' ? fill.attributes.slot : '';
						namedFills.set(
							slotName,
							fill.children.flatMap((c) => toRenderableArray(c.resolve(config).transform(config)))
						);
					}
					const defaultFill = node.children
						.flatMap((c) => toRenderableArray(c.resolve(config).transform(config)))
						.filter((n) => n != null);
					output = replaceSlotPlaceholders(output, namedFills, defaultFill);
				}

				// When the body's SQL references `{{ $attr }}`, each instance of
				// this tag can generate DIFFERENT SQL, so the definition-scoped
				// `tag:query` name is no longer unique on the page — two instances
				// would overwrite each other in the inline-query store and every
				// consumer would read the last writer's result. Re-scope this
				// instance's queries to `tag@<key>:query`, keyed by the call-site
				// attribute values (identical instances still share one query).
				if (bodyNode && componentQueriesUseDollarVariables(bodyNode)) {
					applyInstanceScopeToRenderable(output, meta.fullPath, instanceKeyForCallSite(callSite));
				}

				// Inlined nodes carry the COMPONENT file's parse coordinates;
				// cmd+click-to-source needs the caller's. See call-site-stamp.ts.
				stampCallSiteOnRenderable(output, node);

				return output;
			} finally {
				extendedConfig.callStack.delete(meta.fullPath);
			}
		}
	};
}

/**
 * Build the full `{ tagName -> Schema }` map for a project's custom
 * components, plus the `{ tagName -> CustomComponentMeta }` map the editor
 * autocomplete + AI tool surfaces consume.
 *
 * Tag-name collisions between a built-in tag and a custom component, or
 * between two custom components, are resolved by **dropping the colliding
 * custom component(s)** and reporting it through `collisions`. The built-in
 * tag wins because the built-in is what the rest of the system (editor docs,
 * AI tool prompts, ChartSlots) is hard-wired against; a colliding custom
 * component silently replacing a chart would be a footgun.
 */
export function buildCustomComponentRegistry(
	componentsContent: Record<string, string>,
	reservedTagNames: ReadonlySet<string>
): {
	tags: Record<string, Schema>;
	meta: Record<string, CustomComponentMeta>;
	collisions: { tagName: string; fullPath: string; collidesWith: 'builtin' | 'component' }[];
} {
	const tags: Record<string, Schema> = {};
	const meta: Record<string, CustomComponentMeta> = {};
	const collisions: {
		tagName: string;
		fullPath: string;
		collidesWith: 'builtin' | 'component';
	}[] = [];

	// First pass: group files by their would-be tag name so we can flag BOTH
	// sides of a sibling collision (`components/charts/bar.md` + `components/
	// maps/bar.md` both warn — not just the alphabetically-later one). Without
	// this, the author of the file that "wins" the collision sees no
	// diagnostic and has no idea their tag is shadowing another file.
	const pathsByTagName = new Map<string, string[]>();
	for (const fullPath of Object.keys(componentsContent)) {
		const tagName = tagNameForComponentPath(fullPath);
		const list = pathsByTagName.get(tagName) ?? [];
		list.push(fullPath);
		pathsByTagName.set(tagName, list);
	}

	for (const [fullPath, content] of Object.entries(componentsContent)) {
		const componentMeta = parseCustomComponentMeta(fullPath, content);
		const { tagName } = componentMeta;

		if (reservedTagNames.has(tagName)) {
			// Built-in always wins — drop the custom file from the registry
			// AND flag it. The built-in's docs / behavior are what authors
			// expect when they type `{% value /%}`.
			collisions.push({ tagName, fullPath, collidesWith: 'builtin' });
			continue;
		}

		const siblings = pathsByTagName.get(tagName) ?? [];
		if (siblings.length > 1) {
			// Sibling collision — flag every file in the group, including the
			// one we end up registering. The first-encountered file wins the
			// registry slot (deterministic given Object.entries iteration
			// order); the rest are dropped.
			collisions.push({ tagName, fullPath, collidesWith: 'component' });
			if (fullPath !== siblings[0]) continue;
		}

		tags[tagName] = buildCustomComponentTag(componentMeta);
		meta[tagName] = componentMeta;
	}

	return { tags, meta, collisions };
}

/**
 * Wrap raw component schemas into the `UserComponent` shape used by the
 * editor / docs layer. Custom components only contribute a schema — they
 * inline their body at transform time, so there's no Svelte component or
 * Filter class to wire up. Mirrors how the built-in `partial` tag exports
 * itself as `{ schema }` only.
 */
export function customComponentsAsUserComponents(
	tags: Record<string, Schema>
): Record<string, UserComponent> {
	const out: Record<string, UserComponent> = {};
	for (const [name, schema] of Object.entries(tags)) {
		out[name] = { schema: schema as UserComponent['schema'] };
	}
	return out;
}

function toRenderableArray(nodes: ReturnType<Node['transform']>): RenderableTreeNode[] {
	// Transforms in this pipeline are synchronous (mirrors the partial tag).
	const value = nodes as RenderableTreeNode | RenderableTreeNode[];
	return Array.isArray(value) ? value : [value];
}

const isSlotPlaceholder = (n: RenderableTreeNode): n is Tag =>
	Markdoc.Tag.isTag(n) && n.name === SLOT_PLACEHOLDER;

const hasRealContent = (nodes: RenderableTreeNode[]): boolean =>
	nodes.some((n) => n != null && !(typeof n === 'string' && n.trim() === ''));

/**
 * Replace the body's slot placeholder Tags with the call-site content routed
 * to them. A named slot takes its {% fill %} block; the unnamed default slot
 * takes everything outside fills. A slot nobody filled keeps its fallback
 * children (already transformed). Provided content is spliced as-is — it was
 * transformed in the CALLER's scope and any nested component inside it has
 * already resolved its own slots.
 */
export function replaceSlotPlaceholders(
	output: RenderableTreeNode | RenderableTreeNode[],
	namedFills: ReadonlyMap<string, RenderableTreeNode[]>,
	defaultFill: RenderableTreeNode[]
): RenderableTreeNode | RenderableTreeNode[] {
	const resolveSlot = (tag: Tag): RenderableTreeNode[] => {
		const name = typeof tag.attributes?.name === 'string' ? tag.attributes.name : '';
		const provided = name
			? namedFills.get(name)
			: hasRealContent(defaultFill)
				? defaultFill
				: undefined;
		if (provided && hasRealContent(provided)) return provided;
		// Fallback content may itself nest slots — resolve those too.
		return (tag.children ?? []).flatMap((c) =>
			isSlotPlaceholder(c) ? resolveSlot(c) : [visit(c)]
		);
	};
	const visit = (n: RenderableTreeNode): RenderableTreeNode => {
		if (!Markdoc.Tag.isTag(n)) return n;
		if (n.children?.length) {
			n.children = n.children.flatMap((c) => (isSlotPlaceholder(c) ? resolveSlot(c) : [visit(c)]));
		}
		return n;
	};
	if (Array.isArray(output)) {
		return output.flatMap((n) => (isSlotPlaceholder(n) ? resolveSlot(n) : [visit(n)]));
	}
	return isSlotPlaceholder(output) ? resolveSlot(output) : visit(output);
}

/**
 * Dissolve slot placeholders that survived to the top of the pipeline — a
 * {% slot %} used outside any component (plain page, partial) or a component
 * file previewed standalone. They render their fallback children, so authors
 * see the component's "empty" state instead of nothing.
 */
export function dissolveRemainingSlotPlaceholders(
	tree: RenderableTreeNode | RenderableTreeNode[]
): void {
	const visit = (n: RenderableTreeNode): void => {
		if (!Markdoc.Tag.isTag(n)) return;
		if (n.children?.length) {
			n.children = n.children.flatMap((c) => {
				if (isSlotPlaceholder(c)) {
					const fallback = c.children ?? [];
					fallback.forEach(visit);
					return fallback;
				}
				visit(c);
				return [c];
			});
		}
	};
	if (Array.isArray(tree)) tree.forEach(visit);
	else visit(tree);
}
