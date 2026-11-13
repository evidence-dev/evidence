import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

// Never read ~/.evd: keeps validation in syntax-only mode, with no warehouse.
vi.mock('$lib/auth/credentials.server', () => ({ loadCredentials: async () => null }));

import { GET } from './+server';

const CONFIG = `project:
  name: Validate Test
  evidence: '0.4.6'
pages: ./pages
`;

type ValidateResponse = {
	valid: boolean;
	fileCount: number;
	errorCount: number;
	warningCount: number;
	files: {
		path: string;
		errors: { line: number; endLine: number; severity: string; message: string; id?: string }[];
	}[];
};

async function validate(target?: string): Promise<ValidateResponse> {
	const url = new URL('http://localhost/api/validate');
	if (target) url.searchParams.set('path', target);
	const response = await GET({ url } as never);
	return response.json();
}

let projectDir: string;
let previousCwd: string | undefined;

async function writePage(content: string) {
	await writeFile(path.join(projectDir, 'pages', 'home.md'), content);
}

async function writeComponent(file: string, content = '# Custom component\n') {
	const fullPath = path.join(projectDir, file);
	await mkdir(path.dirname(fullPath), { recursive: true });
	await writeFile(fullPath, content);
}

beforeEach(async () => {
	projectDir = await mkdtemp(path.join(tmpdir(), 'evd-validate-route-'));
	await mkdir(path.join(projectDir, 'pages'));
	await writeFile(path.join(projectDir, 'evidence.config.yaml'), CONFIG);
	previousCwd = process.env.EVIDENCE_PROJECT_CWD;
	process.env.EVIDENCE_PROJECT_CWD = projectDir;
});

afterEach(async () => {
	if (previousCwd === undefined) delete process.env.EVIDENCE_PROJECT_CWD;
	else process.env.EVIDENCE_PROJECT_CWD = previousCwd;
	await rm(projectDir, { recursive: true, force: true });
});

describe('validate route — error counting', () => {
	it('reports a clean page as valid', async () => {
		await writePage('# Hello\n');

		const result = await validate();

		expect(result.valid).toBe(true);
		expect(result.errorCount).toBe(0);
	});

	it.each([
		['an undefined tag', '{% unknown_tag /%}\n', 'tag-undefined'],
		['an unclosed block', '{% details title="x" %}\nhi\n', 'missing-closing']
	])('counts %s (a critical Markdoc error) as an error', async (_, content, id) => {
		await writePage(content);

		const result = await validate();

		const errors = result.files.flatMap((f) => f.errors);
		expect(errors).toContainEqual(expect.objectContaining({ severity: 'critical', id }));
		expect(result.errorCount).toBe(1);
		expect(result.valid).toBe(false);
	});

	it('counts critical and regular errors together', async () => {
		await writePage('{% /details %}\n');

		const result = await validate();

		const severities = result.files.flatMap((f) => f.errors.map((e) => e.severity));
		expect(severities.sort()).toEqual(['critical', 'error']);
		expect(result.errorCount).toBe(2);
	});
});

describe('validate route — custom component names', () => {
	const nameCollision = {
		id: 'custom-component-name-collision',
		severity: 'error',
		line: 1,
		endLine: 1
	};

	it.each([
		['no frontmatter', '# Custom note\n'],
		['comment-only frontmatter', '---\n# Notes about the component\n---\n\n# Custom note\n']
	])('reports a built-in tag name collision on the component file with %s', async (_, content) => {
		await writePage('{% note %}\nA built-in note.\n{% /note %}\n');
		await writeComponent('components/note.md', content);

		const result = await validate();
		expect(result).toMatchObject({
			valid: false,
			fileCount: 2,
			errorCount: 1,
			warningCount: 0,
			files: [
				{ path: 'pages/home.md', errors: [] },
				{
					path: 'components/note.md',
					errors: [{ ...nameCollision, message: expect.stringContaining('built-in tag') }]
				}
			]
		});
	});

	it('reports both files when unused components share a tag name', async () => {
		await writePage('# Hello\n');
		await writeComponent('components/charts/kpi_card.md');
		await writeComponent('pages/kpi_card.md', '---\ntype: component\n---\n# Custom component\n');

		const result = await validate();
		expect(result).toMatchObject({ valid: false, fileCount: 3, errorCount: 2 });
		const collidedPaths = result.files
			.filter((file) => file.errors.some((error) => error.id === nameCollision.id))
			.map((file) => file.path)
			.sort();
		expect(collidedPaths).toEqual(['components/charts/kpi_card.md', 'pages/kpi_card.md']);
	});

	it('accepts a page using a uniquely named custom component', async () => {
		await writePage('{% kpi_card /%}\n');
		await writeComponent('components/kpi_card.md', '---\n# KPI card notes\n---\n\n# KPI card\n');

		const result = await validate();
		expect(result).toMatchObject({ valid: true, fileCount: 1, errorCount: 0 });
	});

	it('keeps single-page validation scoped to the requested page', async () => {
		await writePage('# Hello\n');
		await writeComponent('components/note.md');

		const result = await validate('home.md');
		expect(result).toMatchObject({ valid: true, fileCount: 1, errorCount: 0 });
	});
});
