/**
 * Lineage command — show where connections and tables are used
 */

import { loadCredentials } from './storage.ts';
import { ensureAuthenticated } from './auth.ts';
import { printResult, resolveFormat, fail, type OutputOptions } from './output.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

interface LineageReference {
	type: string;
	table: string;
	connection: string | null;
	connectionType: string | null;
	project?: string | null;
	page?: string | null;
	file?: string | null;
	fileType?: string | null;
	line?: number | null;
	component?: string | null;
	model?: string | null;
	query?: string | null;
}

async function fetchLineage(opts?: { branch?: string }): Promise<LineageReference[]> {
	const credentials = await loadCredentials();
	if (!credentials?.refreshToken && !credentials?.aptToken) {
		throw new Error('Not authenticated. Run `evidence login` first.');
	}
	if (!credentials.organizationId) {
		throw new Error('No organization selected. Run `evidence login` to authenticate.');
	}

	const response = await fetch(`${STUDIO_HOST}/api/cli/lineage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			refreshToken: credentials.refreshToken,
			aptToken: credentials.aptToken,
			organizationId: credentials.organizationId,
			...(opts?.branch ? { branch: opts.branch, version: 'working' } : {})
		})
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch lineage: ${response.status} ${text}`);
	}

	const data = (await response.json()) as { references: LineageReference[] };
	return data.references;
}

function formatRefDetail(ref: LineageReference): string {
	const line = ref.line ? `  Line ${ref.line}` : '';
	if (ref.type === 'query') return `query: ${ref.query}${line}`;
	if (ref.type === 'component') return `${ref.component ?? '—'}${line}`;
	if (ref.type === 'sql_file') return ref.file ?? '—';
	return ref.type;
}

type ProjectBucket = {
	sqlFiles: LineageReference[];
	partials: Map<string, LineageReference[]>;
	pages: Map<string, LineageReference[]>;
};

function bucketRefCount(bucket: ProjectBucket): number {
	return (
		bucket.sqlFiles.length +
		[...bucket.partials.values()].reduce((s, g) => s + g.length, 0) +
		[...bucket.pages.values()].reduce((s, g) => s + g.length, 0)
	);
}

function printProjectBucket(projectName: string, bucket: ProjectBucket, indent: string): void {
	const count = bucketRefCount(bucket);
	console.log(`${indent}${projectName} (${count} ref${count !== 1 ? 's' : ''})`);

	const inner = indent + '  ';
	const leaf = inner + '  ';

	if (bucket.sqlFiles.length > 0) {
		console.log(`${inner}SQL Files (${bucket.sqlFiles.length})`);
		for (const ref of bucket.sqlFiles) {
			console.log(`${leaf}${ref.file ?? '—'}`);
		}
	}

	if (bucket.partials.size > 0) {
		const n = [...bucket.partials.values()].reduce((s, g) => s + g.length, 0);
		console.log(`${inner}Partials (${n} ref${n !== 1 ? 's' : ''})`);
		for (const [fileName, fileRefs] of bucket.partials) {
			console.log(`${leaf}${fileName} (${fileRefs.length} ref${fileRefs.length !== 1 ? 's' : ''})`);
			for (const ref of fileRefs) {
				console.log(`${leaf}  ${formatRefDetail(ref)}`);
			}
		}
	}

	if (bucket.pages.size > 0) {
		const n = [...bucket.pages.values()].reduce((s, g) => s + g.length, 0);
		console.log(`${inner}Pages (${n} ref${n !== 1 ? 's' : ''})`);
		for (const [fileName, fileRefs] of bucket.pages) {
			console.log(`${leaf}${fileName} (${fileRefs.length} ref${fileRefs.length !== 1 ? 's' : ''})`);
			for (const ref of fileRefs) {
				console.log(`${leaf}  ${formatRefDetail(ref)}`);
			}
		}
	}
}

function groupByProject(refs: LineageReference[]): Map<string, ProjectBucket> {
	const byProject = new Map<string, ProjectBucket>();
	for (const ref of refs) {
		const key = ref.project ?? '(unknown)';
		let bucket = byProject.get(key);
		if (!bucket) {
			bucket = { sqlFiles: [], partials: new Map(), pages: new Map() };
			byProject.set(key, bucket);
		}
		if (ref.type === 'sql_file') {
			bucket.sqlFiles.push(ref);
		} else {
			const isPartial = ref.fileType === 'partial';
			const fileMap = isPartial ? bucket.partials : bucket.pages;
			const fileKey = ref.page ?? 'home';
			const group = fileMap.get(fileKey) ?? [];
			group.push(ref);
			fileMap.set(fileKey, group);
		}
	}
	return byProject;
}

function printFullLineage(refs: LineageReference[]): void {
	if (refs.length === 0) {
		console.log('\n  No data references found.\n');
		return;
	}

	// Group: connection → table → { models, project refs }
	type TableBucket = { models: LineageReference[]; projectRefs: LineageReference[] };
	const byConnection = new Map<string, Map<string, TableBucket>>();
	const unconnected = new Map<string, TableBucket>();

	for (const ref of refs) {
		const tableName = ref.table;
		const connKey = ref.connection ?? null;
		const tableMap = connKey
			? (byConnection.get(connKey) ?? new Map<string, TableBucket>())
			: unconnected;
		if (connKey && !byConnection.has(connKey)) byConnection.set(connKey, tableMap);

		let bucket = tableMap.get(tableName);
		if (!bucket) {
			bucket = { models: [], projectRefs: [] };
			tableMap.set(tableName, bucket);
		}

		if (ref.type === 'model') {
			bucket.models.push(ref);
		} else {
			bucket.projectRefs.push(ref);
		}
	}

	console.log('');

	for (const [connName, tables] of byConnection) {
		const connType =
			[...tables.values()]
				.flatMap((b) => [...b.models, ...b.projectRefs])
				.find((r) => r.connectionType)?.connectionType ?? '';
		console.log(`  ${connName} (${connType})`);

		for (const [tableName, bucket] of tables) {
			const total = bucket.models.length + bucket.projectRefs.length;
			console.log(`    ${tableName} (${total} ref${total !== 1 ? 's' : ''})`);

			if (bucket.models.length > 0) {
				console.log(`      Models (${bucket.models.length})`);
				for (const ref of bucket.models) {
					console.log(`        ${ref.model ?? '—'}`);
				}
			}

			if (bucket.projectRefs.length > 0) {
				const byProject = groupByProject(bucket.projectRefs);
				const totalProjectRefs = bucket.projectRefs.length;
				console.log(
					`      Projects (${byProject.size} project${byProject.size !== 1 ? 's' : ''}, ${totalProjectRefs} ref${totalProjectRefs !== 1 ? 's' : ''})`
				);
				for (const [projectName, projectBucket] of byProject) {
					printProjectBucket(projectName, projectBucket, '        ');
				}
			}
		}

		console.log('');
	}

	if (unconnected.size > 0) {
		console.log('  Other references:');
		for (const [tableName, bucket] of unconnected) {
			const total = bucket.models.length + bucket.projectRefs.length;
			console.log(`    ${tableName} (${total} ref${total !== 1 ? 's' : ''})`);

			if (bucket.models.length > 0) {
				for (const ref of bucket.models) {
					console.log(`      model: ${ref.model ?? '—'}`);
				}
			}
			if (bucket.projectRefs.length > 0) {
				const byProject = groupByProject(bucket.projectRefs);
				for (const [projectName, projectBucket] of byProject) {
					printProjectBucket(projectName, projectBucket, '      ');
				}
			}
		}
		console.log('');
	}
}

function printTableLineage(refs: LineageReference[], tableName: string): void {
	const matching = refs.filter((r) => r.table === tableName);

	if (matching.length === 0) {
		console.log(`\n  "${tableName}" is not referenced anywhere.\n`);
		return;
	}

	console.log(
		`\n  "${tableName}" — ${matching.length} reference${matching.length !== 1 ? 's' : ''}:\n`
	);

	const models = matching.filter((r) => r.type === 'model');
	const projectRefs = matching.filter((r) => r.type !== 'model');

	if (models.length > 0) {
		console.log(`  Models (${models.length})`);
		for (const ref of models) {
			console.log(`    ${ref.model ?? '—'}`);
		}
	}

	if (projectRefs.length > 0) {
		const byProject = groupByProject(projectRefs);
		console.log(
			`  Projects (${byProject.size} project${byProject.size !== 1 ? 's' : ''}, ${projectRefs.length} ref${projectRefs.length !== 1 ? 's' : ''})`
		);
		for (const [projectName, bucket] of byProject) {
			printProjectBucket(projectName, bucket, '    ');
		}
	}

	console.log('');
}

export async function lineageCommand(
	args: string[],
	opts: OutputOptions & { branch?: string }
): Promise<void> {
	await ensureAuthenticated();

	try {
		const refs = await fetchLineage({ branch: opts.branch });

		// Pretty (human) view: the indented tree; `lineage table <name>` narrows it.
		if (resolveFormat(opts, 'structured') === 'table') {
			const subcommand = args[0];
			const target = args[1];
			if (subcommand === 'table' && target) {
				printTableLineage(refs, target);
			} else {
				printFullLineage(refs);
			}
			process.exit(0);
		}

		// Machine view: the lineage edges.
		printResult({ kind: 'structured', value: refs }, opts);
		process.exit(0);
	} catch (err) {
		fail(err, opts);
	}
}
