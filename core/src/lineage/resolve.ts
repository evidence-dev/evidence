import { extractSqlTableReferences, type SqlTableReference } from './extract';

export type ReferenceStatus = 'resolved' | 'dynamic' | 'unresolved';

export type ResolvedReference = {
	name: string;
	status: ReferenceStatus;
	type: 'source' | 'inline_query' | 'sql_file' | 'model' | 'unknown';
	chain: string[];
};

export type ResolutionContext = {
	inlineQueries: Map<string, string>;
	sqlFiles: Map<string, string>;
	sourceNames: Set<string>;
	modelNames: Set<string>;
};

/**
 * Resolve a data reference name through the Evidence reference chain.
 * Walks: data attr → inline query / .sql file / model / source
 * Each hop may reference other names via {{template}} or FROM/JOIN.
 * Returns the full resolution chain with status.
 */
export function resolveReference(
	name: string,
	context: ResolutionContext
): ResolvedReference {
	const chain: string[] = [];
	const visited = new Set<string>();

	function walk(raw: string): ResolvedReference | null {
		// A leading slash means "from the project root"; stored keys are bare full paths.
		const current = raw.replace(/^\/+/, '');
		if (visited.has(current)) return null;
		visited.add(current);
		chain.push(current);

		if (context.inlineQueries.has(current)) {
			const sql = context.inlineQueries.get(current)!;
			const deps = extractSqlTableReferences(sql);
			const terminalDep = findTerminalDependency(deps, context, visited, chain);
			if (terminalDep) return terminalDep;
			return { name: current, status: 'resolved', type: 'inline_query', chain: [...chain] };
		}

		if (context.sqlFiles.has(current)) {
			const sql = context.sqlFiles.get(current)!;
			const deps = extractSqlTableReferences(sql);
			const terminalDep = findTerminalDependency(deps, context, visited, chain);
			if (terminalDep) return terminalDep;
			return { name: current, status: 'resolved', type: 'sql_file', chain: [...chain] };
		}

		if (context.sourceNames.has(current)) {
			return { name: current, status: 'resolved', type: 'source', chain: [...chain] };
		}

		if (context.modelNames.has(current)) {
			return { name: current, status: 'resolved', type: 'model', chain: [...chain] };
		}

		return null;
	}

	function findTerminalDependency(
		deps: SqlTableReference[],
		ctx: ResolutionContext,
		vis: Set<string>,
		ch: string[]
	): ResolvedReference | null {
		for (const dep of deps) {
			if (vis.has(dep.name)) continue;
			const savedLen = ch.length;
			const result = walk(dep.name);
			if (result && result.status === 'resolved') {
				return result;
			}
			// Roll back chain and visited entries from the failed walk
			ch.length = savedLen;
			vis.delete(dep.name);
		}
		return null;
	}

	const result = walk(name);
	if (result) return result;

	return { name, status: 'unresolved', type: 'unknown', chain: [...chain] };
}

/**
 * Resolve all data references for a file, given the resolution context.
 * Returns a list of resolved references with their status.
 */
export function resolveAllReferences(
	dataRefNames: string[],
	context: ResolutionContext
): ResolvedReference[] {
	return dataRefNames.map((name) => {
		if (/\{\{[^}]+\}\}/.test(name)) {
			return { name, status: 'dynamic' as const, type: 'unknown' as const, chain: [name] };
		}
		return resolveReference(name, context);
	});
}
