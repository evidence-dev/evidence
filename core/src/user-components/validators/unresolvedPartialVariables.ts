import type { Node, Config } from '@markdoc/markdoc';
import { isValidationContext, type Validator } from './types';
import {
	dirOfPath,
	resolvePartialFile,
	resolveProjectReference
} from '../common/resolve-reference';
import { parseFrontmatter } from '../../utils/parseFrontmatter';
import { createFrontmatterVariablePattern } from '../../filter-variables/frontmatter-variable';
import { TRANSLATIONS_KEY } from '../../constants/variable-keys';

// Partials inherit ONLY translations (see `createScopedConfig`) — $user and
// $organization are dropped in partial scope, so they must not be whitelisted.
const CONTEXT_VARIABLES = new Set<string>([TRANSLATIONS_KEY]);

// Variables visible to a partial's SQL: its own frontmatter plus the keys
// passed via `variables={…}` at its call site. Parent scope is NOT inherited.
interface PartialScope {
	frontmatter: Record<string, unknown>;
	passedKeys: Set<string>;
}

function passedKeysOf(variables: unknown): Set<string> {
	return variables && typeof variables === 'object'
		? new Set(Object.keys(variables))
		: new Set<string>();
}

function frontmatterOf(node: Node | undefined): Record<string, unknown> {
	if (!node) return {};
	const { frontmatter } = parseFrontmatter(node.attributes?.frontmatter as string | undefined);
	return frontmatter;
}

function partialNodeOf(partials: Record<string, Node | Node[]>, file: string): Node | undefined {
	const partial = partials[file];
	const node = Array.isArray(partial) ? partial[0] : partial;
	return node ?? undefined;
}

// Warn on `{{ $var }}` in a partial's SQL with no source — it silently resolves to
// '' and the query reaches the warehouse malformed. Warning-level on purpose.
export const unresolvedPartialVariables =
	(): Validator => (node: Node, config: Config, context: unknown) => {
		if (!isValidationContext(context)) return [];

		const partialFile = node.attributes.file;
		if (!partialFile || typeof partialFile !== 'string') return [];

		const partials = config?.partials;
		if (!partials) return [];

		const resolvedFile = resolvePartialFile(partialFile, node, config);
		const partialNode = partialNodeOf(partials, resolvedFile);
		if (!partialNode) return []; // missing partial is partialFileExists's error

		const unresolved = new Set<string>();
		// The recursion path — cycle guard only. Diamonds (the same partial at
		// two call sites) re-validate per call site, matching the transform's callStack.
		const path = new Set<string>([resolvedFile]);
		collectUnresolved(
			partialNode,
			resolvedFile,
			passedKeysOf(node.attributes.variables),
			partials,
			config,
			unresolved,
			path
		);

		if (unresolved.size === 0) return [];

		const names = [...unresolved]
			.sort()
			.map((v) => `\`$${v}\``)
			.join(', ');
		return [
			{
				id: 'unresolved-partial-variable',
				level: 'warning',
				message: `Partial "${partialFile}" uses ${names} in its SQL, but ${
					unresolved.size === 1 ? 'it is' : 'they are'
				} neither in the partial's frontmatter nor passed via variables={…} at this call site — ${
					unresolved.size === 1 ? 'it' : 'each'
				} resolves to an empty string. Pass the value here (e.g. variables={ ${
					[...unresolved].sort()[0].split('.')[0].split('[')[0]
				}=$${[...unresolved].sort()[0].split('.')[0].split('[')[0]} }) or define it in the partial's frontmatter.`,
				location: node.location
			}
		];
	};

// Walk a partial's tree: check its own SQL fences against `scope`, then recurse into
// nested partials with each call site's own scope — parent vars do NOT carry through.
function collectUnresolved(
	partialNode: Node,
	resolvedFile: string,
	passedKeys: Set<string>,
	partials: Record<string, Node | Node[]>,
	config: Config,
	unresolved: Set<string>,
	path: Set<string>
): void {
	const scope: PartialScope = { frontmatter: frontmatterOf(partialNode), passedKeys };
	const pattern = createFrontmatterVariablePattern();
	walk(partialNode, scope, resolvedFile, partials, config, unresolved, path, pattern);
}

function walk(
	node: Node | Node[],
	scope: PartialScope,
	resolvedFile: string,
	partials: Record<string, Node | Node[]>,
	config: Config,
	unresolved: Set<string>,
	path: Set<string>,
	pattern: RegExp
): void {
	if (Array.isArray(node)) {
		for (const child of node)
			walk(child, scope, resolvedFile, partials, config, unresolved, path, pattern);
		return;
	}

	if (node.type === 'fence' && node.attributes?.language === 'sql') {
		const content = node.attributes.content;
		if (typeof content === 'string') checkSql(content, scope, unresolved, pattern);
	}

	// Nested partial reference: resolve it and validate its SQL with its own scope.
	if (node.tag === 'partial' && typeof node.attributes?.file === 'string') {
		const nestedFile = resolveNestedFile(node.attributes.file, resolvedFile, config);
		if (path.has(nestedFile)) return; // circular refs are partialCircularReference's error
		path.add(nestedFile);
		const nestedNode = partialNodeOf(partials, nestedFile);
		if (nestedNode) {
			collectUnresolved(
				nestedNode,
				nestedFile,
				passedKeysOf(node.attributes.variables),
				partials,
				config,
				unresolved,
				path
			);
		}
		path.delete(nestedFile);
		// A partial tag is self-closing — nothing further to walk inside it.
		return;
	}

	for (const child of node.children ?? []) {
		walk(child, scope, resolvedFile, partials, config, unresolved, path, pattern);
	}
}

function checkSql(
	sql: string,
	scope: PartialScope,
	unresolved: Set<string>,
	pattern: RegExp
): void {
	pattern.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(sql)) !== null) {
		const varPath = match[1];
		// Only the ROOT name decides scope; a nested path like
		// `nested.label` resolves iff `nested` is in scope.
		const rootName = varPath.split('.')[0].split('[')[0];
		if (CONTEXT_VARIABLES.has(rootName)) continue;
		if (Object.hasOwn(scope.frontmatter, rootName)) continue;
		if (scope.passedKeys.has(rootName)) continue;
		unresolved.add(varPath);
	}
}

// A ref inside a partial resolves "from here" relative to that partial's own directory
// (mirrors `partialCircularReference`); legacy projects keep the exact-key lookup.
function resolveNestedFile(file: string, currentPartialFile: string, config: Config): string {
	const cfg = config as { evidenceUseRelativeResolution?: boolean } | undefined;
	if (!cfg?.evidenceUseRelativeResolution) return file;
	return resolveProjectReference(file, dirOfPath(currentPartialFile));
}
