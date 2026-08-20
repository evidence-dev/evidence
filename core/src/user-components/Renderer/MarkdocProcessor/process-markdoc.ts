import Markdoc, { type Node, type RenderableTreeNode, type ValidateError } from '@markdoc/markdoc';
import * as MarkdocStar from '@markdoc/markdoc';
import type { ValidationContext } from '../../validators';
import { validateDeprecatedFrontmatterKeys } from '../../validators/validateDeprecatedFrontmatter';
import { validateInvalidIconName } from '../../validators/validateInvalidIconName';
import { isAgentPath } from '../../agent-path';
import { registerFiltersFromAST } from './register-filters';
import { config as markdocConfig } from '../../../markdoc/config';
import { getUserComponent, isUserComponent, getFilterClassByUserComponentName } from '../../..';
import { parseFrontmatter } from '../../../utils/parseFrontmatter';
import { registerInlineQueriesFromTree } from './register-inline-queries';
import { replaceFilterVariablesWithComponents } from './replaceFilterVariablesWithComponents';
import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
import { createFrontmatterVariablePattern } from '../../../filter-variables/frontmatter-variable';
import { preprocessVariables } from './preprocess-variables';
import type { TranslationMap } from '../../../types/translations';
import type { AccountVariables } from '../../../types/account-variables';
import { TRANSLATIONS_KEY, USER_KEY, ORGANIZATION_KEY } from '../../../constants/variable-keys';
import { resolvePartialFile, type ReferenceResolutionConfig } from '../../common/resolve-reference';
import {
	buildCustomComponentRegistry,
	namespaceComponentQueries,
	collectLocalQueryNames,
	buildQueryRenameMap,
	rewriteEvidenceQueryCalls,
	dissolveRemainingSlotPlaceholders
} from '../../custom-components';
import { tags as builtInTags, nodes as builtInNodes } from '../../..';
import get from 'lodash/get';

const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });

// Preprocessed source text per parsed document root. A WeakMap (not an AST
// attribute) because the document schema rejects unknown attributes.
const documentSources = new WeakMap<Node, string>();

function parsePartial(file: string, content: string): Node {
	const preprocessed = preprocessVariables(content);
	const tokens = tokenizer.tokenize(preprocessed);
	const ast = Markdoc.parse(tokens, { file });
	documentSources.set(ast, preprocessed);
	return ast;
}

/**
 * Drop validation errors located INSIDE an opaque-body tag's body. The body
 * of {% html %} / custom_echart is raw source, but Markdoc still parses it
 * into markdown children (they're load-bearing: the source slice is computed
 * from their line range) and Markdoc's STRUCTURAL validation walks them —
 * misreading JS as markdown (`i*80 … i*0.75` across lines → "Can't nest
 * 'softbreak' in 'em'" ×26 in one GA dry run). Every error attributed to a
 * line inside an opaque body is noise by construction — the body isn't
 * markdoc. The tag's OWN validators anchor at the open-tag line, which sits
 * before the children's range, so they survive this filter.
 */
function filterErrorsInsideOpaqueBodies(ast: Node, errors: ValidateError[]): ValidateError[] {
	// Ranges are file-qualified: errors raised from a referenced partial's AST
	// carry PARTIAL-relative line numbers (location.file = the partial), which
	// can collide with a page-level body span — a real duplicate-fence-name
	// error at partial line 12 must survive a page html block spanning 10–20.
	const ranges: { start: number; end: number; file: string }[] = [];
	const collect = (node: Node): void => {
		if (shouldSkipChildren(node)) {
			const starts = (node.children ?? []).map((c) => c.location?.start.line ?? Infinity);
			const ends = (node.children ?? []).map((c) => c.location?.end.line ?? -Infinity);
			if (starts.length > 0) {
				ranges.push({
					start: Math.min(...starts),
					end: Math.max(...ends),
					file: node.location?.file ?? ''
				});
			}
			return;
		}
		for (const child of node.children ?? []) collect(child);
	};
	collect(ast);
	if (ranges.length === 0) return errors;

	return errors.filter((e) => {
		const line = e.location?.start?.line ?? e.lines?.[0];
		if (line === undefined) return true;
		const file = e.location?.file ?? '';
		return !ranges.some((r) => r.file === file && line >= r.start && line <= r.end);
	});
}

/**
 * Source text for each parsed document, keyed by location.file ('' for the
 * page itself). Exposed on the Markdoc config so schemas whose tag body is
 * raw source code (custom_echart) can slice the exact body text by node
 * location — markdown-transformed children can't reproduce it faithfully.
 */
function buildEvidenceSources(
	ast: Node,
	partialNodes: Record<string, Node>
): Record<string, string | undefined> {
	return {
		'': documentSources.get(ast),
		...Object.fromEntries(
			Object.entries(partialNodes).map(([file, node]) => [file, documentSources.get(node)])
		)
	};
}

function parsePartials(partials: Record<string, string> = {}): Record<string, Node> {
	return Object.fromEntries(
		Object.entries(partials).map(([file, content]) => [file, parsePartial(file, content)])
	);
}

/**
 * Parse component bodies like partials, but additionally namespace each body's
 * inline queries to the component (see `namespaceComponentQueries`). A query
 * defined in a component body is encapsulated — it registers under a scoped
 * name so it can't collide with, or be referenced by, the page or other
 * components. Filters/inputs are deliberately NOT namespaced: they register on
 * the page by their literal id (parity with a partial's inputs) so authors can
 * reference `{{ myinput.value }}` from the page.
 */
function parseComponentBodies(
	customComponents: Record<string, string> = {},
	isQueryRefAttribute?: (tagName: string, attrName: string) => boolean
): Record<string, Node> {
	return Object.fromEntries(
		Object.entries(customComponents).map(([file, content]) => {
			// Parse once to discover the component's own query names. If any are
			// referenced via `evidence.query("...")` literals, rewrite the SOURCE
			// and re-parse: an {% html %} body reaches the sandbox as a slice of
			// the source text (not via the AST), so only a source-level rewrite
			// can scope those calls. The rewrite never adds or removes lines, so
			// node locations (which the html slice depends on) stay valid.
			let ast = parsePartial(file, content);
			const localNames = collectLocalQueryNames(ast);
			if (localNames.size > 0 && content.includes('evidence.query(')) {
				const rewritten = rewriteEvidenceQueryCalls(content, buildQueryRenameMap(localNames, file));
				if (rewritten !== content) ast = parsePartial(file, rewritten);
			}
			return [file, namespaceComponentQueries(ast, file, isQueryRefAttribute)];
		})
	);
}

/**
 * Names reserved by the static built-in tag/node registry. Custom components
 * with a colliding tag name are dropped by `buildCustomComponentRegistry` so
 * the built-in keeps winning — the rest of the system (docs, AI prompts,
 * chart slot allow-lists) is wired against built-in names.
 */
const reservedTagNames = new Set<string>([
	...Object.keys(builtInTags),
	...Object.keys(builtInNodes)
]);

// A single render calls parse() → validate() → transform() in sequence, each
// building a Markdoc config from the SAME `customComponents` object reference.
// buildCustomComponentRegistry runs Zod validation + schema construction +
// collision detection per component, so doing it three times per render is
// pure waste. Memoise on the object identity of `customComponents` (rebuilt as
// a fresh object whenever its content changes, so reference identity implies
// content identity) — the registry depends only on that map plus the constant
// `reservedTagNames`.
const registryCache = new WeakMap<
	Record<string, string>,
	ReturnType<typeof buildCustomComponentRegistry>
>();

function getCustomComponentRegistry(
	customComponents: Record<string, string>
): ReturnType<typeof buildCustomComponentRegistry> {
	const cached = registryCache.get(customComponents);
	if (cached) return cached;
	const built = buildCustomComponentRegistry(customComponents, reservedTagNames);
	registryCache.set(customComponents, built);
	return built;
}

/**
 * Build a Markdoc config that layers custom components on top of the
 * built-in tag registry. Component bodies are parsed and stuffed into
 * `config.partials` (keyed by their full project-root path) so each custom
 * component schema's `transform()` can resolve and inline them — the partial
 * machinery already does branch/circular-ref handling, and we re-use it.
 */
function buildConfig(args: {
	frontmatter: Record<string, unknown>;
	partials: Record<string, string>;
	customComponents: Record<string, string>;
	translations?: TranslationMap;
	account?: AccountVariables;
	userVariables?: Record<string, unknown>;
	declaredCallerVariables?: Record<string, unknown>;
	validationContext?: ValidationContext;
	ast?: Node;
}) {
	const {
		frontmatter,
		partials,
		customComponents,
		translations,
		account,
		userVariables,
		declaredCallerVariables,
		validationContext,
		ast
	} = args;

	const { tags: customTags } = getCustomComponentRegistry(customComponents);

	// A tag attribute holds a QUERY NAME only when its schema's suggestionType is
	// 'table' (e.g. `data=`). Column/text attrs (`x`, `y`, `align`, `title`) use
	// other suggestionTypes even though many also set `affectsQuery`, so keying
	// on `affectsQuery` would wrongly rewrite `x="month"` when a query is named
	// `month`. Used by parseComponentBodies to scope-rename only real query refs.
	const isQueryRefAttribute = (tagName: string, attrName: string): boolean => {
		const schema = customTags[tagName] ?? markdocConfig.tags[tagName];
		// suggestionType is our extension to Markdoc's SchemaAttribute.
		const attr = schema?.attributes?.[attrName] as { suggestionType?: string } | undefined;
		return attr?.suggestionType === 'table';
	};

	const partialNodes = parsePartials(partials);
	const customComponentNodes = parseComponentBodies(customComponents, isQueryRefAttribute);

	const combinedPartials: Record<string, Node> = { ...partialNodes, ...customComponentNodes };

	// Built untyped on purpose: Markdoc's `Config` type doesn't include the
	// `evidenceUseRelativeResolution` / `evidenceBasePath` / `evidenceSources`
	// extension keys we hang on it for our schemas to consume. Annotating
	// would force casting those off — the call sites (`Markdoc.parse` /
	// `validate` / `transform`) accept Partial<Config> and read what they
	// need.
	const config = {
		...markdocConfig,
		// Spread custom tags last: collision detection in
		// buildCustomComponentRegistry has already filtered them out so this
		// merge is always safe, but if the guard ever regresses we still want
		// the built-in to win — keep the spread order conservative.
		tags: { ...customTags, ...markdocConfig.tags },
		partials: combinedPartials,
		variables: {
			...frontmatter,
			[TRANSLATIONS_KEY]: translations ?? {},
			...(account ? { [USER_KEY]: account.user, [ORGANIZATION_KEY]: account.organization } : {}),
			...(userVariables ?? {}),
			// Declared caller variables — only the component-editing path
			// supplies these. Each entry is a name → declared default value
			// from the file's own `attributes:` block, hoisted to a top-
			// level variable so `{{ $title }}` in the body resolves to the
			// declared `default` while editing the component standalone.
			// Pages and partials pass nothing here.
			...(declaredCallerVariables ?? {})
		},
		evidenceUseRelativeResolution: validationContext?.useRelativeResolution,
		evidenceBasePath: validationContext?.basePath,
		...(ast ? { evidenceSources: buildEvidenceSources(ast, combinedPartials) } : {})
	};

	return { config, partialNodes };
}

/**
 * Tag names from open-source Evidence (which authors — and LLMs trained on it
 * — habitually reach for) mapped to a hint teaching the Studio equivalent. A
 * bare "tag 'grid' was not found" is a dead end; the enriched message lets
 * both humans and the AI agent self-correct at the exact failure point,
 * without a real alias tag whose semantics would silently differ (OSS `Grid`
 * WRAPS children into N columns; Studio `row` lays out a single line).
 */
const OSS_TAG_HINTS: Record<string, string> = {
	grid: 'Evidence Studio has no {% grid %}. Put items side-by-side with {% row %} … {% /row %} (children share the width evenly); stack multiple rows for a grid — e.g. two rows of three for a 2×3 layout. Use {% stack %} for vertical grouping.'
};

/** Append the OSS-tag hint to Markdoc's undefined-tag error when one applies. */
function enrichUndefinedTagError(error: ValidateError): ValidateError {
	if (error.error?.id !== 'tag-undefined') return error;
	const name = error.error.message?.match(/'([^']+)'/)?.[1]?.toLowerCase();
	const hint = name ? OSS_TAG_HINTS[name] : undefined;
	if (!hint) return error;
	return {
		...error,
		error: { ...error.error, message: `${error.error.message}. ${hint}` }
	};
}

/**
 * Removes [object Object] strings from text nodes in the tree.
 * This handles the case where users reference an object variable directly
 * (e.g., {{$user}}) instead of a property (e.g., {{$user.email}}).
 */
function removeObjectStringFromTree(tree: RenderableTreeNode): RenderableTreeNode {
	if (!Markdoc.Tag.isTag(tree)) {
		// If it's a string, remove [object Object]
		if (typeof tree === 'string') {
			return tree.replace(/\[object Object\]/g, '');
		}
		return tree;
	}

	// Recursively process children
	const newChildren: RenderableTreeNode[] = tree.children.map((child) =>
		removeObjectStringFromTree(child)
	);

	return new Markdoc.Tag(
		tree.name,
		tree.attributes,
		newChildren,
		tree.location,
		tree.lines,
		tree.id
	);
}

export type Processed = {
	ast: Node;
	tree: RenderableTreeNode;
	validationErrors: ValidateError[];
};

export function process(
	markdown: string,
	// TODO type as unknown - this file should not know specifics about the validation context
	validationContext?: ValidationContext,
	partials?: Record<string, string>,
	translations?: TranslationMap,
	account?: AccountVariables,
	userVariables?: Record<string, unknown>,
	customComponents?: Record<string, string>,
	declaredCallerVariables?: Record<string, unknown>
): Processed {
	const ast = parse(
		markdown,
		validationContext,
		partials,
		translations,
		account,
		userVariables,
		customComponents,
		declaredCallerVariables
	);
	const validationErrors = validate(
		ast,
		validationContext,
		partials,
		translations,
		account,
		userVariables,
		customComponents,
		declaredCallerVariables
	);
	const tree = transform(
		ast,
		validationContext,
		partials,
		translations,
		account,
		userVariables,
		customComponents,
		declaredCallerVariables
	);
	return { ast, tree, validationErrors };
}

export function parse(
	markdown: string,
	// TODO type as unknown - this file should not know specifics about the validation context
	validationContext?: ValidationContext,
	partials: Record<string, string> = {},
	translations?: TranslationMap,
	account?: AccountVariables,
	userVariables?: Record<string, unknown>,
	customComponents: Record<string, string> = {},
	declaredCallerVariables?: Record<string, unknown>
): Node {
	// Preprocess to automatically quote unquoted variable expressions in component attributes
	// Transforms: attr={{var}} → attr="{{var}}"
	const preprocessed = preprocessVariables(markdown);

	const tokens = tokenizer.tokenize(preprocessed);
	const ast = Markdoc.parse(tokens);
	documentSources.set(ast, preprocessed);

	const { frontmatter } = parseFrontmatter(ast.attributes?.frontmatter as string);
	const { config } = buildConfig({
		frontmatter,
		partials,
		customComponents,
		translations,
		account,
		userVariables,
		declaredCallerVariables,
		validationContext
	});

	// TODO move this to MarkdocProcessor - this file should not know specifics about the validation context
	// Register filters from AST if filters context is available
	if (validationContext?.filters) {
		registerFiltersFromAST(
			ast,
			validationContext.filters,
			config.partials ?? {},
			undefined,
			{
				useRelativeResolution: validationContext.useRelativeResolution,
				basePath: validationContext.basePath
			},
			// Sources let registerFiltersFromAST slice {% html %} bodies and
			// statically pre-register `evidence.filters.create(...)` calls.
			buildEvidenceSources(ast, config.partials ?? {}),
			// Component meta lets the walk resolve `{% my_widget /%}` → its body
			// and register any inputs the body defines onto the page (parity
			// with how a referenced partial's inputs register).
			getCustomComponentRegistry(customComponents).meta
		);
	}

	return ast;
}

// Extracts {{ $variable }}, {{ $variable.nested.path }}, and {{ $variable | fallback }}.
// A fallback does NOT suppress extraction — the variable is still validated, so a
// missing variable is still flagged even when a fallback is written (DECISION 1).
export function extractVariablePaths(content: string): string[] {
	const paths: string[] = [];
	// Fresh regex instance to avoid shared lastIndex state
	const pattern = createFrontmatterVariablePattern();
	let match;
	while ((match = pattern.exec(content)) !== null) {
		paths.push(match[1]);
	}
	return paths;
}

function validateVariables(
	ast: Node,
	frontmatter: Record<string, unknown>,
	translations?: TranslationMap,
	account?: AccountVariables,
	userVariables?: Record<string, unknown>,
	/**
	 * Names of variables the file declares as caller-injected. Used by
	 * custom-component files: their frontmatter `attributes:` block
	 * enumerates exactly which `$attr` references in the body are legal.
	 * Injecting them as placeholders into the validator's "known variables"
	 * set means `{{ $title }}` validates when `title` is declared, AND
	 * `{{ $titel }}` errors as undefined — the typo check that blanket
	 * suppression destroys. Partials don't supply this (they have no
	 * declared schema — caller passes arbitrary `variables={...}`).
	 */
	declaredCallerVariables: readonly string[] = []
): ValidateError[] {
	const errors: ValidateError[] = [];

	// Combine frontmatter, translations, account, user, and declared caller
	// variables into a single set for validation. Declared caller variables
	// (for custom components) carry no value — only their PRESENCE matters,
	// since the actual values come from the call site at runtime.
	const variables: Record<string, unknown> = {
		...frontmatter,
		[TRANSLATIONS_KEY]: translations ?? {},
		...(account ? { [USER_KEY]: account.user, [ORGANIZATION_KEY]: account.organization } : {}),
		...(userVariables ?? {}),
		...Object.fromEntries(declaredCallerVariables.map((name) => [name, '']))
	};

	function traverseNode(node: Node) {
		// Check if this is a text node with variable references
		if (node.type === 'text' && node.attributes?.content) {
			const content = node.attributes.content as string;
			const variablePaths = extractVariablePaths(content);

			for (const variablePath of variablePaths) {
				const value = get(variables, variablePath);

				if (value === undefined) {
					const variableName = variablePath.split('.')[0].split('[')[0];
					const isTranslationKey = variableName === TRANSLATIONS_KEY;
					const isUserKey = variableName === USER_KEY;
					const isOrganizationKey = variableName === ORGANIZATION_KEY;
					const isAccountVariables = isUserKey || isOrganizationKey;

					// Skip validation for account variables if not provided (e.g., embedded views)
					if (isAccountVariables && !account) {
						continue;
					}
					// Same logic for translations. CI's markdown-validation check
					// doesn't load the translations table — without this skip every
					// $translations.* reference fires `undefined-translation-key`.
					// Real undefined keys are still caught in the editor / preview /
					// published paths, which all pass `translations`.
					if (isTranslationKey && !translations) {
						continue;
					}

					errors.push({
						type: 'text',
						lines: node.lines || [0, 0],
						location: node.location || {
							start: { line: 0, character: 0 },
							end: { line: 0, character: 0 }
						},
						error: {
							id: isTranslationKey
								? 'undefined-translation-key'
								: isAccountVariables
									? 'undefined-account-variable'
									: 'undefined-frontmatter-variable',
							level: 'error',
							message: isTranslationKey
								? `Undefined translation key: $${variablePath}`
								: isAccountVariables
									? `Undefined account variable: $${variablePath}`
									: `Undefined frontmatter variable: $${variablePath}`
						}
					});
				}
			}
		}

		// Same body-language guard as validateFilterVariables (see below) —
		// custom_echart's JSON5 body shouldn't be walked as Markdoc text.
		if (shouldSkipChildren(node)) return;

		// Recursively check children
		if (node.children) {
			for (const child of node.children) {
				traverseNode(child);
			}
		}
	}

	traverseNode(ast);
	return errors;
}

/**
 * For tags whose body is opaque source code (custom_echart's JSON5 body,
 * html's HTML body), text-walking validators must skip the
 * children — otherwise text nodes derived from Markdoc's accidental parse of
 * the source (e.g. a `{"foo": 1}}` substring) get fed through
 * interpolateQueryStrings, whose bracket-balance check false-positives on
 * JSON `}}` closes. Per-reference validation lives in the tag's own schema.
 */
function shouldSkipChildren(node: Node): boolean {
	if (node.type !== 'tag' || !node.tag) return false;
	if (!isUserComponent(node.tag)) return false;
	const { schema } = getUserComponent(node.tag);
	return Boolean(schema.bodyLanguage && schema.bodyLanguage !== 'markdoc');
}

function validateFilterVariables(
	ast: Node,
	validationContext?: ValidationContext
): ValidateError[] {
	const errors: ValidateError[] = [];

	// Only validate if we have the necessary contexts
	if (!validationContext?.filters || !validationContext?.inlineQueries) {
		return errors;
	}

	const processor = new VariableProcessor(
		validationContext.filters,
		validationContext.inlineQueries
	);

	function traverseNode(node: Node) {
		// Check if this is a text node with filter variable references
		if (node.type === 'text' && node.attributes?.content) {
			const content = node.attributes.content as string;
			// Look for filter variable patterns: {{ filter.property }} (NOT {{ $... }})
			const filterPattern = /\{\{(?!\s*\$)([^{}]+)\}\}/;

			if (filterPattern.test(content)) {
				// Validate using VariableProcessor
				const validationErrors = processor.validateString(content, {
					location: node.location
				});

				for (const validationError of validationErrors) {
					errors.push({
						type: 'text',
						lines: node.lines || [0, 0],
						location: node.location || {
							start: { line: 0, character: 0 },
							end: { line: 0, character: 0 }
						},
						error: validationError
					});
				}
			}
		}

		// Skip children of tags whose body is opaque source — they have their
		// own per-reference validators that don't trip on JSON braces.
		if (shouldSkipChildren(node)) return;

		// Recursively check children
		if (node.children) {
			for (const child of node.children) {
				traverseNode(child);
			}
		}
	}

	traverseNode(ast);
	return errors;
}

/**
 * File-wide rule: HTML tags in Markdown text are rejected (authors should
 * use Evidence components instead). Lives here rather than in `textSchema`
 * because the rule must NOT apply to text nodes that are descendants of an
 * opaque-body tag — `custom_echart`'s JSON5 body, `html`'s HTML
 * body, anything else with `bodyLanguage !== 'markdoc'`. Inside those, an
 * `<b>` is part of an ECharts tooltip formatter string or raw HTML the
 * sandbox renders — perfectly legitimate and not Markdown-in-disguise.
 *
 * Markdoc's native validate() runs without parent context, so the old
 * textSchema-based rule couldn't make this distinction. Walking from the
 * top with `shouldSkipChildren` short-circuits the descent into opaque
 * bodies, matching how `validateFilterVariables` already handles them.
 */
function validateNoHtmlTags(ast: Node): MarkdocStar.ValidateError[] {
	const errors: MarkdocStar.ValidateError[] = [];

	function traverseNode(node: Node) {
		if (node.type === 'text' && typeof node.attributes?.content === 'string') {
			if (/<[a-z]/i.test(node.attributes.content)) {
				errors.push({
					type: 'text',
					lines: node.lines || [0, 0],
					location: node.location || {
						start: { line: 0, character: 0 },
						end: { line: 0, character: 0 }
					},
					error: {
						id: 'html-tags-not-allowed',
						message:
							'Raw HTML is not supported in markdown text. Wrap it in an {% html %} block — it supports full HTML, JavaScript, and custom visualizations — or use a built-in Evidence component.',
						level: 'error'
					}
				});
			}
		}

		// Don't descend into opaque-body tags — their contents are not
		// Markdown text and follow their own validation rules.
		if (shouldSkipChildren(node)) return;

		if (node.children) {
			for (const child of node.children) traverseNode(child);
		}
	}

	traverseNode(ast);
	return errors;
}

function validateNoNestedInlineQueries(ast: Node): MarkdocStar.ValidateError[] {
	const errors: MarkdocStar.ValidateError[] = [];

	function traverse(node: Node, insideTag: string | undefined) {
		if (
			insideTag &&
			node.type === 'fence' &&
			node.attributes?.language === 'sql' &&
			node.attributes?.meta
		) {
			errors.push({
				type: node.type,
				lines: node.lines,
				location: node.location,
				error: {
					id: 'nested-inline-query',
					level: 'error',
					message: `Inline queries cannot be defined inside components. Move this query definition outside the ${insideTag} component.`,
					location: node.location
				}
			});
		}

		if (node.children) {
			for (const child of node.children) {
				traverse(child, node.tag ?? insideTag);
			}
		}
	}

	traverse(ast, undefined);
	return errors;
}

/**
 * A component that SHIPS an input with a fixed literal id, used more than
 * once on a page, shares ONE filter across every instance — selecting in one
 * card updates all of them. Dry-run agents and users both read that as a bug
 * ("per-instance state" is the intuitive expectation), and the condition is
 * exactly detectable with zero false positives: warn on the second and later
 * call sites, naming the shared ids and the id-as-attribute fix. Non-literal
 * ids (id=$attr, id="{{ … }}") are skipped — those are already per-call-site.
 */
function validateSharedComponentInputs(
	ast: Node,
	componentMeta: Record<string, { fullPath: string }>,
	partialNodes: Record<string, Node>
): ValidateError[] {
	// Count call sites per custom tag on THIS page.
	const callSites = new Map<string, Node[]>();
	const walk = (node: Node): void => {
		if (node.type === 'tag' && node.tag && componentMeta[node.tag]) {
			const list = callSites.get(node.tag) ?? [];
			list.push(node);
			callSites.set(node.tag, list);
		}
		if (shouldSkipChildren(node)) return;
		for (const child of node.children ?? []) walk(child);
	};
	walk(ast);

	const errors: ValidateError[] = [];
	for (const [tagName, nodes] of callSites) {
		if (nodes.length < 2) continue;
		const body = partialNodes[componentMeta[tagName].fullPath];
		if (!body) continue;
		// Literal input ids declared directly in the body.
		const sharedIds: string[] = [];
		const scan = (node: Node): void => {
			if (
				node.type === 'tag' &&
				node.tag &&
				getFilterClassByUserComponentName(node.tag) &&
				typeof node.attributes?.id === 'string' &&
				!node.attributes.id.includes('{{')
			) {
				sharedIds.push(node.attributes.id);
			}
			for (const child of node.children ?? []) scan(child);
		};
		scan(body);
		if (sharedIds.length === 0) continue;

		const ids = [...new Set(sharedIds)].map((id) => `"${id}"`).join(', ');
		for (const node of nodes.slice(1)) {
			errors.push({
				type: 'tag',
				lines: node.lines ?? [0, 0],
				location: node.location ?? { start: { line: 0 }, end: { line: 0 } },
				error: {
					id: 'shared-component-input',
					level: 'warning',
					message: `"${tagName}" is used ${nodes.length} times on this page and ships an input with a fixed id (${ids}) — all instances share ONE filter, so selecting in any card updates every card. If instances should filter independently, declare the id as an attribute (e.g. \`filter_id: { type: string }\`, body \`id="{{$filter_id}}"\`) and pass a different value per call site.`
				}
			});
		}
	}
	return errors;
}

/**
 * "A card grid of html-based components" is the first layout everyone builds,
 * and it silently renders as a full-width STACK: an autosized {% html %}
 * block (no height=) can't collapse into {% row %} columns. Documented, but
 * the failure is visual-only — nothing red, just a layout that isn't what
 * the author asked for (both GA dry runs hit it). Warn at the row, naming
 * the offending child and the fix. Covers direct {% html %} children and
 * custom components whose body embeds a heightless {% html %}.
 */
function validateRowAutosizedHtml(
	ast: Node,
	componentMeta: Record<string, { fullPath: string }>,
	partialNodes: Record<string, Node>
): ValidateError[] {
	const bodyHasHeightlessHtml = (body: Node): boolean => {
		let found = false;
		const scan = (n: Node): void => {
			if (n.type === 'tag' && n.tag === 'html' && n.attributes?.height === undefined) {
				found = true;
			}
			for (const child of n.children ?? []) scan(child);
		};
		scan(body);
		return found;
	};

	const errors: ValidateError[] = [];
	const walk = (node: Node): void => {
		if (node.type === 'tag' && node.tag === 'row') {
			for (const child of node.children ?? []) {
				if (child.type !== 'tag' || !child.tag) continue;
				let offender: string | null = null;
				if (child.tag === 'html' && child.attributes?.height === undefined) {
					offender = 'this {% html %} block';
				} else if (componentMeta[child.tag]) {
					const body = partialNodes[componentMeta[child.tag].fullPath];
					if (body && bodyHasHeightlessHtml(body)) offender = `"${child.tag}"`;
				}
				if (offender) {
					errors.push({
						type: 'tag',
						lines: child.lines ?? node.lines ?? [0, 0],
						location: child.location ?? node.location ?? { start: { line: 0 }, end: { line: 0 } },
						error: {
							id: 'row-autosized-html',
							level: 'warning',
							message: `row: ${offender} contains an autosized {% html %} block (no height=) — autosized blocks render full-width, so this row will STACK instead of forming columns. Pass height= on the html block for grid layouts, or expect stacking.`
						}
					});
				}
			}
		}
		if (shouldSkipChildren(node)) return;
		for (const child of node.children ?? []) walk(child);
	};
	walk(ast);
	return errors;
}

/**
 * `.selected` is the SQL-QUOTED accessor ('Clothing') — correct in a WHERE
 * clause, ugly in a heading. Both GA dry-run agents reached for it in display
 * text because it's the property they'd just used in SQL; the unquoted forms
 * (bare `{{ x }}` — context-aware — or `{{ x.literal }}`) are one property
 * away but nothing surfaced them at the moment of the mistake. Warn on
 * `.selected` in markdown TEXT nodes with the fix. (Explicitly wanting quoted
 * display text is rare enough that warning-level is the right trade.)
 */
function validateQuotedValueInText(ast: Node): ValidateError[] {
	const errors: ValidateError[] = [];
	const TOKEN = /\{\{\s*([A-Za-z_]\w*)\.selected\s*(?:\|[^}]*)?\}\}/;
	const walk = (node: Node): void => {
		if (node.type === 'text' && typeof node.attributes?.content === 'string') {
			const m = node.attributes.content.match(TOKEN);
			if (m) {
				errors.push({
					type: 'text',
					lines: node.lines || [0, 0],
					location: node.location || {
						start: { line: 0, character: 0 },
						end: { line: 0, character: 0 }
					},
					error: {
						id: 'quoted-value-in-text',
						level: 'warning',
						message: `{{ ${m[1]}.selected }} renders the SQL-QUOTED value ('Clothing') — right for a WHERE clause, not for display text. Use {{ ${m[1]} }} or {{ ${m[1]}.literal }} here (unquoted).`
					}
				});
			}
		}
		// Fence content rides in a child text node — `.selected` inside SQL is
		// exactly right, so never descend into fences.
		if (node.type === 'fence') return;
		if (shouldSkipChildren(node)) return;
		for (const child of node.children ?? []) walk(child);
	};
	walk(ast);
	return errors;
}

export function validate(
	ast: Node,
	// TODO type as unknown - this file should not know specifics about the validation context
	validationContext?: ValidationContext,
	partials?: Record<string, string>,
	translations?: TranslationMap,
	account?: AccountVariables,
	userVariables?: Record<string, unknown>,
	customComponents: Record<string, string> = {},
	/**
	 * Variables the validated file declares as caller-injected (i.e. the
	 * `attributes:` keys for a custom-component file), each mapped to its
	 * declared `default:` value (or empty string when no default).
	 * Forwarded to `validateVariables` so a body `{{ $title }}` validates
	 * when `title` is declared and `{{ $titel }}` errors as undefined; the
	 * VALUES (not just the names) flow into the rendering path so the
	 * preview pane substitutes declared defaults when editing the
	 * component standalone. Pages + partials pass empty.
	 */
	declaredCallerVariables: Record<string, unknown> = {}
): ValidateError[] {
	const { frontmatter, errors: yamlErrors } = parseFrontmatter(
		ast.attributes?.frontmatter as string
	);

	const { config, partialNodes } = buildConfig({
		frontmatter,
		partials: partials ?? {},
		customComponents,
		translations,
		account,
		userVariables,
		declaredCallerVariables,
		validationContext,
		ast
	});

	const rawValidationErrors = Markdoc.validate(ast, config, validationContext);

	// Filter out Markdoc's built-in variable validation errors since we handle them in variable-processor.ts
	const filteredValidationErrors = rawValidationErrors
		.filter((error) => {
			// Filter out "Undefined variable" errors - we handle these ourselves
			return !error.error?.message?.includes('Undefined variable');
		})
		.map(enrichUndefinedTagError);

	const childParentErrors = validateAllowedChildrenAndParents(ast);
	const duplicateFilterErrors = validateDuplicateFilterIds(ast, partialNodes, config);
	const duplicateFenceErrors = validateDuplicateFenceNames(ast, partialNodes, config);
	const reservedFenceNameErrors = validateReservedQueryNames(ast, partialNodes, config);
	const variableErrors = validateVariables(
		ast,
		frontmatter,
		translations,
		account,
		userVariables,
		Object.keys(declaredCallerVariables)
	);
	const filterVariableErrors = validateFilterVariables(ast, validationContext);
	const nestedInlineQueryErrors = validateNoNestedInlineQueries(ast);
	const htmlTagErrors = validateNoHtmlTags(ast);
	// `agent/` files are markdown but not pages — a SKILL.md REQUIRES the `name`
	// key the page rules call deprecated, so page frontmatter advice there is
	// actively wrong. Guard here rather than at each caller so future
	// frontmatter rules inherit it.
	const isAgentFile = isAgentPath(validationContext?.basePath ?? '');
	const rawFrontmatter = ast.attributes?.frontmatter as string | undefined;
	const deprecatedFrontmatterErrors = isAgentFile
		? []
		: validateDeprecatedFrontmatterKeys(rawFrontmatter, validationContext);
	const invalidIconErrors = isAgentFile
		? []
		: validateInvalidIconName(rawFrontmatter, validationContext);
	// Enum/type checks against a VARIABLE value are guaranteed false positives
	// in both spellings: a template string (`type="{{$tone}}"` → Got '{{…}}')
	// and an unquoted variable (`type=$tone` → Got '[object Object]', because
	// Markdoc's validate never resolves variables). Both resolve at runtime
	// through variable processing; real literal mistakes still fail.
	const withoutTemplateEnumErrors = filteredValidationErrors.filter(
		(e) =>
			!(
				(e.error?.id === 'attribute-value-invalid' || e.error?.id === 'attribute-type-invalid') &&
				/Got '([^']*\{\{|\[object Object\])/.test(e.error?.message ?? '')
			)
	);
	filteredValidationErrors.length = 0;
	filteredValidationErrors.push(...withoutTemplateEnumErrors);

	filteredValidationErrors.push(
		...childParentErrors,
		...duplicateFilterErrors,
		...duplicateFenceErrors,
		...reservedFenceNameErrors,
		...variableErrors,
		...filterVariableErrors,
		...nestedInlineQueryErrors,
		...htmlTagErrors,
		...deprecatedFrontmatterErrors,
		...invalidIconErrors,
		...yamlErrors,
		...validateSharedComponentInputs(
			ast,
			getCustomComponentRegistry(customComponents).meta,
			(config.partials ?? {}) as Record<string, Node>
		),
		...validateQuotedValueInText(ast),
		...validateRowAutosizedHtml(
			ast,
			getCustomComponentRegistry(customComponents).meta,
			(config.partials ?? {}) as Record<string, Node>
		)
	);

	return filterErrorsInsideOpaqueBodies(ast, filteredValidationErrors);
}

export function transform(
	ast: Node,
	validationContext?: ValidationContext,
	partials?: Record<string, string>,
	translations?: TranslationMap,
	account?: AccountVariables,
	userVariables?: Record<string, unknown>,
	customComponents: Record<string, string> = {},
	/** Same as `validate()` — name → default value for the editing-standalone
	 * preview path; empty for pages, partials, and all non-editor renders. */
	declaredCallerVariables: Record<string, unknown> = {}
): RenderableTreeNode {
	const { frontmatter } = parseFrontmatter(ast.attributes?.frontmatter as string);
	const { config } = buildConfig({
		frontmatter,
		partials: partials ?? {},
		customComponents,
		translations,
		account,
		userVariables,
		declaredCallerVariables,
		validationContext,
		ast
	});

	let tree = Markdoc.transform(ast, config);
	tree = removeObjectStringFromTree(tree);

	// {% slot %} placeholders not consumed by a component transform (slot on a
	// plain page/partial, or a component file previewed standalone) dissolve
	// into their fallback content so nothing synthetic reaches the renderer.
	dissolveRemainingSlotPlaceholders(tree);

	tree = automaticallyWrapConsecutiveComponentsInRow(tree);
	tree = automaticallyWrapConsecutiveConditionals(tree);
	tree = restructureAccordionItems(tree);
	tree = replaceFilterVariablesWithComponents(tree) as RenderableTreeNode;

	if (validationContext?.inlineQueries) {
		registerInlineQueriesFromTree(tree, validationContext.inlineQueries);
	}

	removeInlineQueries(tree);

	return tree;
}

function validateAllowedChildrenAndParents(node: Node, parent?: Node): ValidateError[] {
	const errorsFromChildren = node.children.flatMap((child) =>
		validateAllowedChildrenAndParents(child, node)
	);
	if (!node.tag) return errorsFromChildren;

	const errors: ValidateError[] = [];

	if (!isUserComponent(node.tag)) {
		return [];
	}

	const {
		schema: { allowedParents, allowedChildren }
	} = getUserComponent(node.tag);
	const parentTag = parent?.tag;

	if (allowedParents?.length) {
		if (typeof parentTag !== 'undefined' && !allowedParents.includes(parentTag)) {
			errors.push({
				type: node.type,
				lines: node.lines,
				location: node.location,
				error: {
					id: 'invalid-parent',
					level: 'error',
					message: `${node.tag} cannot be nested within a ${parentTag}`,
					location: node.location
				}
			});
		}
		if (typeof parentTag === 'undefined') {
			let parentTags = allowedParents.join(', ');
			if (allowedParents.length > 1) {
				parentTags = `one of: ${parentTags}`;
			}
			errors.push({
				type: node.type,
				lines: node.lines,
				location: node.location,
				error: {
					id: 'invalid-parent',
					level: 'error',
					message: `${node.tag} must be rendered within ${parentTags}`,
					location: node.location
				}
			});
		}
	}

	if (node.children.length && allowedChildren?.length) {
		const invalidChildren = node.children.filter((child) => {
			if (!child.tag) return false;
			if (allowedChildren.includes(child.tag)) return false;
			return true;
		});
		const childrenErrors: MarkdocStar.ValidateError[] = invalidChildren.map((child) => ({
			type: node.type,
			lines: node.lines,
			location: node.location,
			error: {
				id: 'invalid-child',
				level: 'error',
				message: `${node.tag} cannot have ${child.tag} as a child. ${node.tag} supports ${allowedChildren.join(', ')}`,
				location: node.location
			}
		}));
		errors.push(...childrenErrors);
	}

	return [...errors, ...errorsFromChildren];
}

function validateDuplicateFilterIds(
	ast: Node,
	partials?: Record<string, Node>,
	config?: ReferenceResolutionConfig
): MarkdocStar.ValidateError[] {
	const errors: MarkdocStar.ValidateError[] = [];
	const filterDefinitions = new Map<string, Node[]>();

	// Collect filter definitions from main AST
	collectFilterDefinitions(ast, filterDefinitions);

	// Find which partials are actually referenced on this page
	const referencedPartials = new Set<string>();
	collectReferencedPartials(ast, referencedPartials, config);

	// Collect filter definitions from referenced partials only
	if (partials) {
		for (const [partialName, partialAst] of Object.entries(partials)) {
			if (referencedPartials.has(partialName)) {
				collectFilterDefinitions(partialAst, filterDefinitions);
			}
		}
	}

	// Create validation errors for non-identical duplicates
	for (const [filterId, nodes] of filterDefinitions) {
		if (nodes.length > 1) {
			// Check if all nodes with this ID are identical
			const firstNode = nodes[0];
			const hasNonIdenticalDuplicates = nodes.some((node) => !areNodesIdentical(firstNode, node));

			if (hasNonIdenticalDuplicates) {
				for (const node of nodes) {
					errors.push({
						type: node.type,
						lines: node.lines,
						location: node.location,
						error: {
							id: 'duplicate-id',
							level: 'error',
							message: `Duplicate ID "${filterId}" found. Filters with the same ID must be identical.`,
							location: node.location
						}
					});
				}
			}
		}
	}

	return errors;
}

function validateDuplicateFenceNames(
	ast: Node,
	partials?: Record<string, Node>,
	config?: ReferenceResolutionConfig
): MarkdocStar.ValidateError[] {
	const errors: MarkdocStar.ValidateError[] = [];
	const fenceDefinitions = new Map<string, Node[]>();

	// Collect fence definitions from main AST
	collectFenceDefinitions(ast, fenceDefinitions);

	// Find which partials are actually referenced on this page
	const referencedPartials = new Set<string>();
	collectReferencedPartials(ast, referencedPartials, config);

	// Collect fence definitions from referenced partials only
	if (partials) {
		for (const [partialName, partialAst] of Object.entries(partials)) {
			if (referencedPartials.has(partialName)) {
				collectFenceDefinitions(partialAst, fenceDefinitions);
			}
		}
	}

	// Create validation errors for any duplicates
	for (const [fenceName, nodes] of fenceDefinitions) {
		if (nodes.length > 1) {
			// Flag all nodes with duplicate names
			for (const node of nodes) {
				errors.push({
					type: node.type,
					lines: node.lines,
					location: node.location,
					error: {
						id: 'duplicate-fence-name',
						level: 'error',
						message: `Duplicate query name "${fenceName}" found. Query names must be unique.`,
						location: node.location
					}
				});
			}
		}
	}

	return errors;
}

/**
 * `:` is reserved as the component-scope marker: a custom component's inline
 * queries register page-wide as `<tag>:<name>` (see
 * `namespaceComponentQueries`) and are private to that component. If an author
 * could name a query `kpi_card:revenue`, they could impersonate (or collide
 * with) a component's private query — so user-authored fence names may not
 * contain `:`. Walks the same surface as the duplicate-name check (page +
 * referenced partials); the inlined component bodies carrying system-minted
 * scoped names are transform-time only and never reach this walk.
 */
function validateReservedQueryNames(
	ast: Node,
	partials?: Record<string, Node>,
	config?: ReferenceResolutionConfig
): MarkdocStar.ValidateError[] {
	const errors: MarkdocStar.ValidateError[] = [];
	const fenceDefinitions = new Map<string, Node[]>();

	collectFenceDefinitions(ast, fenceDefinitions);

	const referencedPartials = new Set<string>();
	collectReferencedPartials(ast, referencedPartials, config);
	if (partials) {
		for (const [partialName, partialAst] of Object.entries(partials)) {
			if (referencedPartials.has(partialName)) {
				collectFenceDefinitions(partialAst, fenceDefinitions);
			}
		}
	}

	for (const [fenceName, nodes] of fenceDefinitions) {
		if (!fenceName.includes(':')) continue;
		for (const node of nodes) {
			errors.push({
				type: node.type,
				lines: node.lines,
				location: node.location,
				error: {
					id: 'reserved-query-name',
					level: 'error',
					message: `Query name "${fenceName}" contains ":", which is reserved for component-scoped queries. Rename the query without ":".`,
					location: node.location
				}
			});
		}
	}

	return errors;
}

function collectReferencedPartials(
	node: Node,
	referencedPartials: Set<string>,
	config?: ReferenceResolutionConfig
): void {
	// If this is a partial tag, collect the referenced file (resolved to the
	// full-path map key in the new model, so it matches the partial map below).
	if (node.type === 'tag' && node.tag === 'partial' && node.attributes.file) {
		referencedPartials.add(resolvePartialFile(node.attributes.file, node, config));
	}

	// Recursively collect from children
	if (node.children) {
		for (const child of node.children) {
			collectReferencedPartials(child, referencedPartials, config);
		}
	}
}

function collectFilterDefinitions(node: Node, filterDefinitions: Map<string, Node[]>): void {
	// If this is a user component with filter capabilities, collect it
	if (node.type === 'tag' && node.tag && isUserComponent(node.tag)) {
		const userComponent = getUserComponent(node.tag);
		if (userComponent.Filter && node.attributes.id && typeof node.attributes.id === 'string') {
			const filterId = node.attributes.id;
			if (!filterDefinitions.has(filterId)) {
				filterDefinitions.set(filterId, []);
			}
			filterDefinitions.get(filterId)!.push(node);
		}
	}

	// Recursively collect from children
	if (node.children) {
		for (const child of node.children) {
			collectFilterDefinitions(child, filterDefinitions);
		}
	}
}

function collectFenceDefinitions(node: Node, fenceDefinitions: Map<string, Node[]>): void {
	// If this is a fence with a meta attribute (name), collect it
	if (node.type === 'fence' && node.attributes.meta && typeof node.attributes.meta === 'string') {
		const fenceName = node.attributes.meta.trim();
		if (fenceName) {
			if (!fenceDefinitions.has(fenceName)) {
				fenceDefinitions.set(fenceName, []);
			}
			fenceDefinitions.get(fenceName)!.push(node);
		}
	}

	// Recursively collect from children
	if (node.children) {
		for (const child of node.children) {
			collectFenceDefinitions(child, fenceDefinitions);
		}
	}
}

function areNodesIdentical(node1: Node, node2: Node): boolean {
	// Must be the same component type
	if (node1.tag !== node2.tag) {
		return false;
	}

	// Must have the same attributes
	const attrs1 = node1.attributes || {};
	const attrs2 = node2.attributes || {};

	const keys1 = Object.keys(attrs1).sort();
	const keys2 = Object.keys(attrs2).sort();

	// Different number of attributes
	if (keys1.length !== keys2.length) {
		return false;
	}

	// Different attribute names
	if (keys1.some((key, index) => key !== keys2[index])) {
		return false;
	}

	// Different attribute values
	for (const key of keys1) {
		if (JSON.stringify(attrs1[key]) !== JSON.stringify(attrs2[key])) {
			return false;
		}
	}

	return true;
}

// Components with isFilterInput=true that should auto-group together
// TODO: Make this dynamic by reading from schemas instead of hardcoding
const FILTER_INPUT_COMPONENTS = new Set([
	'dropdown',
	'text_input',
	'date_grain_selector',
	'comparison_selector',
	'range_calendar',
	'toggle',
	'button_group',
	'table_filter',
	'slider'
]);

// TODO does this need to be recursive to work on non-root-level nodes?
const automaticallyWrapConsecutiveComponentsInRow = (
	tree: RenderableTreeNode
): RenderableTreeNode => {
	if (!Markdoc.Tag.isTag(tree) || !tree.children.length) return tree;

	const newTree = new Markdoc.Tag(
		tree.name,
		tree.attributes,
		[],
		tree.location,
		tree.lines,
		tree.id
	);

	for (let i = 0; i < tree.children.length; i++) {
		const node = tree.children[i];

		// If this node isn't a user component, just add it to the root ast children
		if (!Markdoc.Tag.isTag(node) || !isUserComponent(node.name)) {
			newTree.children.push(node);
			continue;
		}
		const { schema } = getUserComponent(node.name);

		// If this node doesnt go in a row, just add it to the root ast children
		const shouldBeInRow =
			schema.componentWrapper &&
			'flex' in schema.componentWrapper &&
			schema.componentWrapper.flex?.automaticallyWrapConsecutiveComponentsInRow;
		if (!shouldBeInRow) {
			newTree.children.push(node);
			continue;
		}

		// Try to add to existing row for this node
		const lastNode = newTree.children[newTree.children.length - 1];
		if (
			lastNode &&
			Markdoc.Tag.isTag(lastNode) &&
			lastNode.name === 'row' &&
			Markdoc.Tag.isTag(lastNode.children[0])
		) {
			const firstChildName = lastNode.children[0].name;
			const currentName = node.name;

			// Check if both are filter inputs (cross-component grouping)
			const bothAreFilterInputs =
				FILTER_INPUT_COMPONENTS.has(firstChildName) && FILTER_INPUT_COMPONENTS.has(currentName);

			// Original behavior: same component name
			const sameComponentType = firstChildName === currentName;

			if (bothAreFilterInputs || sameComponentType) {
				// Set align="bottom" for filter input rows if not already set
				if (bothAreFilterInputs && !lastNode.attributes.align) {
					lastNode.attributes.align = 'bottom';
				}
				lastNode.children.push(node);
				continue;
			}
		}

		// If the next node should be grouped with this one, create a row for them
		const nextNode = tree.children[i + 1];
		if (nextNode && Markdoc.Tag.isTag(nextNode)) {
			const nextName = nextNode.name;
			const currentName = node.name;

			// Check if both are filter inputs (cross-component grouping)
			const bothAreFilterInputs =
				FILTER_INPUT_COMPONENTS.has(currentName) && FILTER_INPUT_COMPONENTS.has(nextName);

			// Original behavior: same component name
			const sameComponentType = nextName === currentName;

			if (bothAreFilterInputs || sameComponentType) {
				// Set align="bottom" for filter input rows
				const rowAttributes = bothAreFilterInputs ? { align: 'bottom' } : {};
				const row = new Markdoc.Tag('row', rowAttributes, [node], undefined, undefined, undefined);
				newTree.children.push(row);
				continue;
			}
		}

		// Otherwise, just add this node to children
		newTree.children.push(node);
	}

	return newTree;
};

const automaticallyWrapConsecutiveConditionals = <T extends RenderableTreeNode>(tree: T): T => {
	if (!Markdoc.Tag.isTag(tree) || !tree.children.length) return tree;

	const newTree = new Markdoc.Tag(
		tree.name,
		tree.attributes,
		[],
		tree.location,
		tree.lines,
		tree.id
	);

	for (let i = 0; i < tree.children.length; i++) {
		const node = tree.children[i];

		// If this node isn't a Tag, just add it to the tree's children
		if (!Markdoc.Tag.isTag(node)) {
			newTree.children.push(node);
			continue;
		}

		// If this node is an `if`, create a new conditional wrapper with this node as a child
		if (node.name === 'if') {
			const conditional = new Markdoc.Tag(
				'conditional',
				{},
				[automaticallyWrapConsecutiveConditionals(node)],
				undefined, // location - synthetic wrapper
				undefined, // lines - synthetic wrapper
				undefined // id - will be auto-generated
			);
			newTree.children.push(conditional);
			continue;
		}

		if (node.name !== 'else_if' && node.name !== 'else') {
			newTree.children.push(automaticallyWrapConsecutiveConditionals(node));
			continue;
		}

		// Find existing conditional to add `else_if` and `else` to
		const conditional = newTree.children[newTree.children.length - 1];
		if (!conditional || !Markdoc.Tag.isTag(conditional) || conditional.name !== 'conditional') {
			newTree.children.push(node);
			continue;
		}

		// If we found a conditional but it already has an `else`, it can't get any more
		const conditionalHasElse = conditional.children.some(
			(child) => Markdoc.Tag.isTag(child) && child.name === 'else'
		);
		if (conditionalHasElse) {
			newTree.children.push(node);
			continue;
		}

		// Add this `else_if`/`else` node to the conditional, but first recursively process it
		conditional.children.push(automaticallyWrapConsecutiveConditionals(node));
	}

	return newTree as T;
};

// Restructures every accordion_item in the tree so its children are split into:
//   - an optional accordion_title tag (rich title content, renders in the trigger)
//   - an accordion_body_slot tag wrapping everything else (renders in the content)
// Doing this at tree level lets AccordionItem expose title and body as two
// independent snippets without inspecting its children at render time.
const restructureAccordionItems = (tree: RenderableTreeNode): RenderableTreeNode => {
	if (!Markdoc.Tag.isTag(tree)) return tree;

	tree.children = tree.children.map((child) => restructureAccordionItems(child));

	if (tree.name !== 'accordion_item') return tree;

	const titleChildren: RenderableTreeNode[] = [];
	const bodyChildren: RenderableTreeNode[] = [];
	let titleTag: MarkdocStar.Tag | null = null;

	for (const child of tree.children) {
		if (Markdoc.Tag.isTag(child) && child.name === 'accordion_title') {
			if (titleTag === null) titleTag = child;
			// When accordion_title contains nothing but a single auto-wrapped <p>,
			// unwrap it so pure-text titles render flush (matching `title="..."`
			// which is a <span>). Keep the structure when there are multiple
			// children so blocks (e.g. big_value) still stack above any text.
			if (
				child.children.length === 1 &&
				Markdoc.Tag.isTag(child.children[0]) &&
				(child.children[0] as MarkdocStar.Tag).name === 'p'
			) {
				titleChildren.push(...(child.children[0] as MarkdocStar.Tag).children);
			} else {
				titleChildren.push(...child.children);
			}
			continue;
		}
		bodyChildren.push(child);
	}

	const newChildren: RenderableTreeNode[] = [];
	if (titleTag) {
		newChildren.push(
			new Markdoc.Tag(
				'accordion_title',
				titleTag.attributes,
				titleChildren,
				titleTag.location,
				titleTag.lines,
				titleTag.id
			)
		);
	}
	newChildren.push(
		new Markdoc.Tag('accordion_body_slot', {}, bodyChildren, undefined, undefined, undefined)
	);

	tree.children = newChildren;
	return tree;
};

const isSqlFence = (node: RenderableTreeNode): node is MarkdocStar.Tag =>
	Markdoc.Tag.isTag(node) &&
	node.name === 'fence' &&
	node.attributes.language === 'sql' &&
	typeof node.attributes.meta === 'string' &&
	node.attributes.meta.trim() !== '';

const removeInlineQueries = (tree: RenderableTreeNode): void => {
	if (!Markdoc.Tag.isTag(tree)) return;

	tree.children = tree.children.filter((child) => !isSqlFence(child));
	tree.children.forEach(removeInlineQueries);
};
