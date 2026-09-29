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
	errorCount: number;
	warningCount: number;
	files: { path: string; errors: { severity: string; id?: string }[] }[];
};

async function validate(): Promise<ValidateResponse> {
	const response = await GET({ url: new URL('http://localhost/api/validate') } as never);
	return response.json();
}

let projectDir: string;
let previousCwd: string | undefined;

async function writePage(content: string) {
	await writeFile(path.join(projectDir, 'pages', 'home.md'), content);
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
