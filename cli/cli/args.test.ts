import { describe, it, expect, afterEach } from 'vitest';
import { parseArgs } from './args.ts';

/** Run parseArgs with a synthetic argv (everything after `node script`). */
function parse(...argv: string[]) {
	const original = process.argv;
	process.argv = ['node', 'evidence', ...argv];
	try {
		return parseArgs();
	} finally {
		process.argv = original;
	}
}

afterEach(() => {
	// parseArgs reads NO_COLOR via resolveColor; keep tests independent.
	delete process.env.NO_COLOR;
});

describe('shared output options', () => {
	it('defaults to no explicit format and color on', () => {
		const { output } = parse('query', 'select 1');
		expect(output.format).toBeNull();
		expect(output.verbose).toBe(false);
		expect(output.color).toBe(true);
		expect(output.all).toBe(false);
		expect(output.limit).toBeNull();
		expect(output.columns).toBeNull();
	});

	it('parses --format and normalizes jsonl to ndjson', () => {
		expect(parse('query', 'select 1', '--format', 'csv').output.format).toBe('csv');
		expect(parse('query', 'select 1', '--format', 'jsonl').output.format).toBe('ndjson');
		expect(parse('query', 'select 1', '--format', 'ndjson').output.format).toBe('ndjson');
	});

	it('ignores an unknown --format value', () => {
		expect(parse('query', 'select 1', '--format', 'yaml').output.format).toBeNull();
	});

	it('treats --json as an alias for --format json', () => {
		expect(parse('connectors', '--json').output.format).toBe('json');
	});

	it('parses --columns into a trimmed, ordered list', () => {
		expect(parse('query', 'select 1', '--columns', 'a, b ,c').output.columns).toEqual([
			'a',
			'b',
			'c'
		]);
	});

	it('parses --limit and --all', () => {
		expect(parse('query', 'select 1', '--limit', '50').output.limit).toBe(50);
		expect(parse('query', 'select 1', '-l', '5').output.limit).toBe(5);
		expect(parse('query', 'select 1', '--all').output.all).toBe(true);
	});

	it('honors --no-color and the NO_COLOR env var', () => {
		expect(parse('query', 'select 1', '--no-color').output.color).toBe(false);
		process.env.NO_COLOR = '1';
		expect(parse('query', 'select 1').output.color).toBe(false);
	});

	it('treats -v / --verbose as verbose', () => {
		expect(parse('query', 'select 1', '-v').output.verbose).toBe(true);
		expect(parse('query', 'select 1', '--verbose').output.verbose).toBe(true);
	});
});

describe('version vs verbose', () => {
	it('--version selects the version command', () => {
		expect(parse('--version').command).toBe('version');
		expect(parse('version').command).toBe('version');
	});

	it('-v no longer means version (it is verbose)', () => {
		// `evidence -v` falls through to the default screen, not version.
		expect(parse('-v').command).not.toBe('version');
	});
});

describe('query SQL positional parsing', () => {
	it('captures a plain SQL argument', () => {
		expect(parse('query', 'select 1 as a').query.sql).toBe('select 1 as a');
	});

	it('captures SQL that begins with a leading -- comment (the hang bug)', () => {
		const sql = '-- a comment\nselect 1 as a';
		expect(parse('query', sql).query.sql).toBe(sql);
	});

	it('captures SQL placed after a value flag', () => {
		expect(parse('query', '--limit', '5', 'select 1').query.sql).toBe('select 1');
	});

	it('captures SQL placed before a flag', () => {
		const parsed = parse('query', 'select 1', '--format', 'csv');
		expect(parsed.query.sql).toBe('select 1');
		expect(parsed.output.format).toBe('csv');
	});

	it('leaves sql null for the stdin sentinel and --file', () => {
		expect(parse('query', '-').query.sql).toBe('-');
		expect(parse('query', '--file', 'q.sql').query.sql).toBeNull();
		expect(parse('query', '--file', 'q.sql').query.file).toBe('q.sql');
	});
});

describe('init --warehouse', () => {
	it('defaults to no warehouse', () => {
		const parsed = parse('init', 'my-project');
		expect(parsed.command).toBe('init');
		expect(parsed.initTargetDir).toBe('my-project');
		expect(parsed.initWarehouse).toBeNull();
	});

	it('parses a supported warehouse, case-insensitively', () => {
		expect(parse('init', '--warehouse', 'snowflake').initWarehouse).toBe('snowflake');
		expect(parse('init', '--warehouse', 'BigQuery').initWarehouse).toBe('bigquery');
	});

	it('parses --warehouse alongside a target directory', () => {
		const parsed = parse('init', 'my-project', '--warehouse', 'snowflake');
		expect(parsed.initTargetDir).toBe('my-project');
		expect(parsed.initWarehouse).toBe('snowflake');
	});
});

describe('schema --table', () => {
	it('captures the table name to narrow to', () => {
		expect(parse('schema', '--table', 'orders').schemaTable).toBe('orders');
	});

	it('is null when not provided', () => {
		expect(parse('schema').schemaTable).toBeNull();
	});
});

describe('launch / link / unlink', () => {
	it('recognizes the new commands', () => {
		expect(parse('launch').command).toBe('launch');
		expect(parse('link').command).toBe('link');
		expect(parse('unlink').command).toBe('unlink');
	});

	it('parses launch flags', () => {
		const parsed = parse(
			'launch',
			'--name',
			'My Report',
			'--branch',
			'release',
			'--root-directory',
			'apps/web',
			'--upload-credentials'
		);
		expect(parsed.command).toBe('launch');
		expect(parsed.publishName).toBe('My Report');
		expect(parsed.branch).toBe('release');
		expect(parsed.rootDirectory).toBe('apps/web');
		expect(parsed.uploadCredentials).toBe(true);
	});

	it('defaults launch flags to null/false', () => {
		const parsed = parse('launch');
		expect(parsed.branch).toBeNull();
		expect(parsed.rootDirectory).toBeNull();
		expect(parsed.uploadCredentials).toBe(false);
	});

	it('reads link --project as a Studio project, not a chdir path', () => {
		const parsed = parse('link', '--project', 'my-slug');
		expect(parsed.command).toBe('link');
		expect(parsed.linkProject).toBe('my-slug');
		// The global --project chdir override must NOT swallow it for link.
		expect(parsed.project).toBeNull();
	});

	it('accepts a positional project for link', () => {
		expect(parse('link', 'my-slug').linkProject).toBe('my-slug');
	});

	it('reads unlink --project', () => {
		expect(parse('unlink', '--project', '42').linkProject).toBe('42');
	});

	it('still treats --project as a chdir override for non-link commands', () => {
		const parsed = parse('query', 'select 1', '--project', './sub');
		expect(parsed.project).toBe('./sub');
		expect(parsed.linkProject).toBeNull();
	});
});
