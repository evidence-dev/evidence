/**
 * Markdoc processor for CLI
 * Uses @evidence/core's config and registers inline queries and filters
 */

import Markdoc, {
	type Node,
	type RenderableTreeNode,
	type ValidateError,
	type Tag
} from '@markdoc/markdoc';
import { config } from './config';
import { Filters, type SerializedFilters } from '@evidence/core/Filters.svelte';
import { InlineQueries } from '@evidence/core/user-components/common/inline-queries';
import type { ValidationContext } from '@evidence/core/user-components/validators/types';
import type { Metadata } from '@evidence/core/metadata/Metadata.svelte';
import { InlineQueryMetadata } from '@evidence/core/metadata/inline-query-metadata.svelte';
import type { QueryService } from '@evidence/core/user-components/interfaces/query-service';
import type { TranslationMap } from '@evidence/core/types/translations';
import { preprocessVariables } from '@evidence/core/user-components/Renderer/MarkdocProcessor/preprocess-variables';
import { registerFiltersFromAST } from '@evidence/core/user-components/Renderer/MarkdocProcessor/register-filters';
import {
	process as coreProcess,
	transform as uiTransform
} from '@evidence/core/user-components/Renderer/MarkdocProcessor/process-markdoc';
import { dialectFor, type WarehouseType } from '@evidence/core/sql-dialect';
import { withTimeout } from '$lib/timeout';

export type ConnectionType = WarehouseType | null;

const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });

export interface SqlFiles {
	[path: string]: string;
}

export interface ProcessOptions {
	/** SQL files to make available as data sources */
	sqlFiles?: SqlFiles;
	/** Connection type from connection.yaml — controls the dialect filters use
	 * when materializing SQL fragments at serialization time (e.g. RangeCalendar). */
	connectionType?: ConnectionType;
	/** Markdown files keyed by full slug, for `{% partial file="..." /%}` resolution. */
	partials?: Record<string, string>;
	/**
	 * Project custom components keyed by full slug (e.g. `components/my_bar`).
	 * Each file declares its own Markdoc tag at validate/transform time; the
	 * filename without extension is the tag name (`{% my_bar /%}`) and the
	 * frontmatter's `attributes` block defines the schema.
	 */
	customComponents?: Record<string, string>;
	/** When present, table/column/SQL validators run; when omitted they're skipped. */
	metadata?: Metadata;
	/** When present, the page's ```sql blocks are introspected (one warehouse
	 * round-trip each) so column-type validators resolve their column types and
	 * broken queries surface as errors. Omit to skip — page rendering doesn't need it. */
	queryService?: QueryService;
	/** New project-root model: full project-root path of the page being processed. */
	basePath?: string;
	/** New project-root model: resolve refs "from here / from root". */
	useRelativeResolution?: boolean;
	/** Resolved translations (translations.yaml) for the current language, exposed
	 * to markdown as the `$translations` variable. */
	translations?: TranslationMap;
}

export interface Processed {
	ast: Node;
	tree: RenderableTreeNode;
	validationErrors: ValidateError[];
	serializedInlineQueries: Record<string, string>;
	serializedFilters: SerializedFilters;
}

/**
 * Parse, validate, and transform markdown to a renderable tree.
 *
 * Delegates to @evidence/core's `process` so the CLI runs the same validation as
 * Studio. core populates the `filters`/`inlineQueries` we pass it as a side
 * effect of parse/transform, which we then serialize for the client renderer.
 */
export async function process(markdown: string, options: ProcessOptions = {}): Promise<Processed> {
	const dialect = dialectFor(options.connectionType);

	const filters = new Filters({
		url: new URL('http://localhost'),
		projectSettings: { first_day_of_week: 'sunday' },
		updateUrl: undefined,
		dialect
	});
	const inlineQueries = new InlineQueries(
		{ filterContexts: [filters] },
		undefined,
		options.sqlFiles,
		undefined,
		{ basePath: options.basePath, useRelativeResolution: options.useRelativeResolution }
	);

	// Validators run before transform registers inline queries, so register
	// page-level ones up front — else same-page queries read as missing tables.
	const { ast: preAst, referencedDataSources, definedInlineQueries } = preRegisterInlineQueries(
		markdown,
		inlineQueries
	);
	// Same ordering problem for filters: introspection interpolates `{{filter_id}}`
	// references, so the page's filter components must exist (with empty values)
	// before any warehouse round-trip — else every reference is "Missing filter ID".
	registerFiltersFromAST(preAst, filters, parsePartials(options.partials), undefined, {
		basePath: options.basePath,
		useRelativeResolution: options.useRelativeResolution
	});
	const inlineQueryMetadata = options.queryService
		? await loadInlineQueryMetadata(
				options.queryService,
				inlineQueries,
				filters,
				definedInlineQueries,
				referencedDataSources
			)
		: undefined;

	const validationContext: ValidationContext = {
		metadata: options.metadata,
		filters,
		inlineQueries,
		inlineQueryMetadata,
		trees: undefined,
		dialect,
		basePath: options.basePath,
		useRelativeResolution: options.useRelativeResolution
	};

	const { ast, tree, validationErrors } = coreProcess(
		markdown,
		validationContext,
		options.partials,
		options.translations,
		undefined,
		undefined,
		options.customComponents
	);

	return {
		ast,
		tree,
		validationErrors: inlineQueryMetadata
			? [...validationErrors, ...collectInlineQueryErrors(ast, inlineQueryMetadata)]
			: validationErrors,
		serializedInlineQueries: inlineQueries.toSerialized(),
		serializedFilters: filters.toSerialized()
	};
}

// Surface warehouse errors from introspecting the page's ```sql blocks (bad SQL,
// unknown column) as page errors — mirrors the editor.
function collectInlineQueryErrors(
	ast: Node,
	inlineQueryMetadata: InlineQueryMetadata
): ValidateError[] {
	const errors: ValidateError[] = [];

	function walk(node: Node) {
		if (node.type === 'fence' && node.attributes?.language === 'sql' && node.attributes?.meta) {
			const table = inlineQueryMetadata.getTable(node.attributes.meta as string);
			if (table?.error) {
				errors.push({
					type: 'fence',
					lines: node.lines ?? [],
					location: node.location,
					error: { id: 'inline-query-error', level: 'error', message: table.error }
				});
			}
		}
		if (node.children) {
			for (const child of node.children) walk(child);
		}
	}
	walk(ast);
	return errors;
}

const INLINE_QUERY_METADATA_TIMEOUT_MS = 15_000;

async function loadInlineQueryMetadata(
	queryService: QueryService,
	inlineQueries: InlineQueries,
	filters: Filters,
	definedInlineQueries: Set<string>,
	referencedDataSources: Set<string>
): Promise<InlineQueryMetadata | undefined> {
	// Introspect every page-defined ```sql block (so broken ones surface even when
	// unused) plus any data=-referenced sql file. Unreferenced project .sql files
	// are skipped — describing every one on every page would be needlessly costly.
	const known = new Set(inlineQueries.getAllNames());
	const names = new Set(definedInlineQueries);
	for (const name of referencedDataSources) if (known.has(name)) names.add(name);
	if (names.size === 0) return undefined;

	const metadata = new InlineQueryMetadata(queryService, { inlineQueries, pageFilters: filters });
	try {
		await withTimeout(
			metadata.loadAll([...names]),
			INLINE_QUERY_METADATA_TIMEOUT_MS,
			'inline query metadata load timed out'
		);
	} catch {
		return undefined;
	}
	return metadata;
}

// Pre-registration ASTs must be built like core's parse() — preprocessed so
// unquoted `attr={{var}}` syntax tokenizes as a valid tag (it skips code
// fences, so inline-query extraction is unaffected). Without this, a filter
// component using that syntax never registers and introspection still errors.
function preRegisterParse(markdown: string): Node {
	return Markdoc.parse(tokenizer.tokenize(preprocessVariables(markdown)));
}

function parsePartials(partials?: Record<string, string>): Record<string, Node> | undefined {
	if (!partials) return undefined;
	return Object.fromEntries(
		Object.entries(partials).map(([name, content]) => [name, preRegisterParse(content)])
	);
}

function preRegisterInlineQueries(
	markdown: string,
	inlineQueries: InlineQueries
): { ast: Node; referencedDataSources: Set<string>; definedInlineQueries: Set<string> } {
	const ast = preRegisterParse(markdown);
	const referencedDataSources = new Set<string>();
	const definedInlineQueries = new Set<string>();

	function walk(node: Node) {
		if (node.type === 'fence' && node.attributes?.language === 'sql' && node.attributes?.meta) {
			const name = node.attributes.meta as string;
			inlineQueries.set(name, (node.attributes.content as string) ?? '');
			definedInlineQueries.add(name);
		}
		if (node.type === 'tag' && typeof node.attributes?.data === 'string') {
			referencedDataSources.add(node.attributes.data);
		}
		if (node.children) {
			for (const child of node.children) walk(child);
		}
	}
	walk(ast);
	return { ast, referencedDataSources, definedInlineQueries };
}

/**
 * Parse markdown string into AST
 * Preprocesses markdown to quote unquoted variables (e.g., attr={{var}} → attr="{{var}}")
 */
export function parse(markdown: string): Node {
	const preprocessed = preprocessVariables(markdown);
	const tokens = tokenizer.tokenize(preprocessed);
	return Markdoc.parse(tokens);
}

/**
 * Validate AST against config
 */
export function validate(ast: Node): ValidateError[] {
	return Markdoc.validate(ast, config);
}

/**
 * Transform AST into renderable tree
 * Uses the full transform pipeline from @evidence/core which includes:
 * - automaticallyWrapConsecutiveComponentsInRow (groups filters horizontally)
 * - automaticallyWrapConsecutiveConditionals
 * - replaceFilterVariablesWithComponents
 */
export function transform(
	ast: Node,
	validationContext?: ValidationContext,
	partials?: Record<string, string>
): RenderableTreeNode {
	return uiTransform(ast, validationContext, partials);
}

/**
 * Serialize tree for SSR transfer
 */
export function serializeTree(tree: RenderableTreeNode): string {
	return JSON.stringify(tree);
}

/**
 * Deserialize tree on client
 */
export function deserializeTree(serialized: string): RenderableTreeNode {
	const parsed = JSON.parse(serialized);
	return reconstructTree(parsed);
}

/**
 * Reconstruct Markdoc.Tag instances from plain objects
 */
function reconstructTree(node: unknown): RenderableTreeNode {
	if (node === null || node === undefined) return node as RenderableTreeNode;
	if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
		return node as RenderableTreeNode;
	}
	if (Array.isArray(node)) {
		return node.map(reconstructTree) as unknown as RenderableTreeNode;
	}
	if (typeof node === 'object' && node !== null) {
		const obj = node as Record<string, unknown>;
		// Check if this is a serialized Tag (has $$mdtype marker or name property)
		if (
			obj.$$mdtype === 'Tag' ||
			(obj.name && typeof obj.name === 'string' && 'attributes' in obj)
		) {
			const children = Array.isArray(obj.children) ? obj.children.map(reconstructTree) : [];
			return new Markdoc.Tag(
				obj.name as string,
				obj.attributes as Record<string, unknown>,
				children,
				obj.location as Tag['location'],
				obj.lines as number[],
				obj.id as string
			);
		}
	}
	return node as RenderableTreeNode;
}
