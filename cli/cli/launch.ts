import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { confirm, select, text, spinner, isCancel, cancel } from '@clack/prompts';
import { openBrowser } from './auth.ts';
import { serializeAccessState } from '@evidence/core/access-yaml/serialize';
import {
	resolveCredentials,
	resolveOrganization,
	resolveProjectName,
	postJson,
	trackRotatedToken,
	STUDIO_HOST
} from './cli-shared.ts';
import { loadProjectConfig } from './project-config/load-config.ts';
import { loadConnectionConfig } from './connection/index.ts';
import {
	detectRepoOwnerName,
	detectDefaultBranch,
	detectCurrentBranch,
	detectRootPath,
	isGitRepo
} from './git-detect.ts';
import type { StoredCredentials } from './storage.ts';

interface LaunchOptions {
	name?: string | null;
	branch?: string | null;
	rootDirectory?: string | null;
	uploadCredentials?: boolean;
}

interface GithubStatus {
	appInstalled: boolean;
	repoAccessible: boolean;
	approvalPending: boolean;
	accountLogin: string | null;
	linkedProject: { slug: string; assetId: string } | null;
	installUrl: string;
	refreshToken?: string;
}

const POLL_INTERVAL_MS = 3000;
const POLL_DEADLINE_MS = 10 * 60 * 1000;

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function done(label: string): void {
	console.log(`  ✓ ${label}`);
}

// Is the GitHub CLI on PATH? Read-only PATH scan (no process spawned).
function hasGh(): boolean {
	const names = process.platform === 'win32' ? ['gh.exe', 'gh.cmd'] : ['gh'];
	return (process.env.PATH || '')
		.split(path.delimiter)
		.some((dir) => dir && names.some((n) => existsSync(path.join(dir, n))));
}

async function promptText(
	message: string,
	fallback: string,
	placeholder?: string
): Promise<string> {
	// Show the default as faint placeholder text (not a prefilled editable
	// value) so "type nothing → accept default" reads the same for every
	// prompt. clack returns '' on an empty submit, so fall back to `fallback`.
	const answer = await text({
		message,
		placeholder: fallback || placeholder || undefined
	});
	if (isCancel(answer)) {
		cancel('Cancelled.');
		process.exit(1);
	}
	return ((answer as string) ?? '').trim() || fallback;
}

export async function githubStatus(
	credentials: StoredCredentials,
	organizationId: string,
	repo: { host: string; owner: string; repo: string }
): Promise<GithubStatus> {
	const res = (await postJson('/api/cli/github/status', {
		refreshToken: credentials.refreshToken,
		organizationId,
		github_host: repo.host,
		repo_owner: repo.owner,
		repo_name: repo.repo
	})) as unknown as GithubStatus;
	await trackRotatedToken(credentials, res.refreshToken);
	return res;
}

/**
 * Ensure the Evidence GitHub App is installed for the org and can access the
 * repo. Idempotent: returns immediately if already set up; otherwise opens the
 * browser install flow and polls until done (TTY), or prints the URL and exits
 * 0 (non-TTY). Handles the org-admin approval-pending path.
 */
export async function ensureGithubInstalled(
	credentials: StoredCredentials,
	organizationId: string,
	repo: { host: string; owner: string; repo: string },
	interactive: boolean
): Promise<void> {
	const checking = spinner();
	checking.start('Checking GitHub App access');
	let status = await githubStatus(credentials, organizationId, repo);
	if (status.appInstalled && status.repoAccessible) {
		checking.stop('GitHub App installed and repo access granted');
		return;
	}
	checking.stop('GitHub App not connected yet');

	console.log('\n  → Install the Evidence GitHub App and grant access to this repo:');
	console.log(`\n    ${status.installUrl}\n`);

	if (!interactive) {
		// Exit non-zero: setup is incomplete and needs a human to install the app.
		// A caller (CI/agent) must not read this as "connected".
		console.log('  Open the URL above to finish, then re-run to verify.\n');
		process.exit(1);
	}

	openBrowser(status.installUrl);

	const deadline = Date.now() + POLL_DEADLINE_MS;
	let lastMessage = '';
	while (!(status.appInstalled && status.repoAccessible)) {
		if (Date.now() > deadline) {
			console.log('\n  Timed out waiting for the GitHub App install.');
			console.log('  Finish in the browser, then re-run.\n');
			process.exit(1);
		}
		const message = !status.appInstalled
			? status.approvalPending
				? '  Waiting for an org admin to approve the GitHub App install…'
				: '  Waiting for the GitHub App to be installed…'
			: '  App installed — now grant access to this repo…';
		if (message !== lastMessage) {
			console.log(message);
			lastMessage = message;
		}
		await sleep(POLL_INTERVAL_MS);
		status = await githubStatus(credentials, organizationId, repo);
	}
	done('GitHub App installed and repo access granted');
}

export async function launch(options: LaunchOptions = {}): Promise<void> {
	const projectRoot = process.cwd();
	const interactive = Boolean(process.stdin.isTTY);

	// ── Stage: auth ──────────────────────────────────────────────────────────
	const credentials = await resolveCredentials();

	// ── Detect the external repo (required) ────────────────────────────────────
	const repo = await detectRepoOwnerName(projectRoot);
	if (!repo) {
		const ghHint = () => {
			if (!hasGh()) return;
			console.error('  Or, with the GitHub CLI:\n');
			console.error('    gh repo create --private --source=. --remote=origin --push\n');
		};
		if (!(await isGitRepo(projectRoot))) {
			console.error(
				'\n  This folder is not a git repository yet. Set one up, then run launch again:\n'
			);
			console.error('    git init');
			console.error('    git branch -m main');
			console.error('    git add -A && git commit -m "Initial commit"');
			console.error('    git remote add origin git@github.com:<you>/<repo>.git\n');
			ghHint();
		} else {
			console.error('\n  No GitHub `origin` remote found. Add one, then run launch again:\n');
			console.error('    git remote add origin git@github.com:<you>/<repo>.git\n');
			ghHint();
		}
		process.exit(1);
	}

	// ── Stage: org ─────────────────────────────────────────────────────────────
	const organizationId = await resolveOrganization(credentials);

	// ── Auto-detect branch + root directory ────────────────────────────────────
	const detectedBranch =
		options.branch ??
		(await detectDefaultBranch(projectRoot)) ??
		(await detectCurrentBranch(projectRoot)) ??
		'main';
	const detectedRoot =
		options.rootDirectory ?? (await detectRootPath(projectRoot, projectRoot)) ?? '';

	let branch = detectedBranch;
	let rootDirectory = detectedRoot;

	// ── Stage: project (reuse repo-linked project → create) ────────────────────
	let assetId: string;
	let projectSlug: string | undefined;
	let reused = false;

	// Detect a project in this org already bound to this repo (e.g. a teammate
	// already ran launch, or the repo was connected in the Studio UI).
	const pre = await githubStatus(credentials, organizationId, repo);
	if (pre.linkedProject) {
		assetId = pre.linkedProject.assetId;
		projectSlug = pre.linkedProject.slug;
		reused = true;
		done(`Repo already connected to Studio project "${projectSlug}"`);
	} else {
		const config = await loadProjectConfig(projectRoot);
		const name = await resolveProjectName(config.project.name, options.name ?? null);

		if (interactive) {
			branch = await promptText(
				'Published branch — Studio deploys from this branch',
				detectedBranch
			);
			rootDirectory = await promptText(
				'Subdirectory containing your Evidence project (blank = repo root)',
				detectedRoot,
				'(repo root)'
			);
		}

		const s = spinner();
		s.start(`Creating Studio project "${name}"`);
		let created;
		try {
			created = await postJson('/api/cli/projects', {
				refreshToken: credentials.refreshToken,
				organizationId,
				name,
				github: {
					github_host: repo.host,
					repo_owner: repo.owner,
					repo_name: repo.repo,
					default_branch: branch,
					...(rootDirectory ? { root_path: rootDirectory } : {})
				}
			});
		} catch (e) {
			s.stop('Project creation failed');
			throw e;
		}
		await trackRotatedToken(credentials, created.refreshToken as string | undefined);
		if (typeof created.assetId !== 'string' || !created.assetId) {
			s.stop('Project creation failed');
			throw new Error('Studio returned an invalid project response (missing assetId).');
		}
		assetId = created.assetId;
		projectSlug = created.slug as string | undefined;
		s.stop(`Created Studio project${projectSlug ? ` "${projectSlug}"` : ''}`);
	}

	// Re-running with explicit --branch/--root-directory on an already-linked
	// project: push the new values to the binding (create already sent them).
	if (reused && (options.branch || options.rootDirectory)) {
		const s = spinner();
		s.start('Updating project binding');
		try {
			const res = await postJson('/api/cli/projects/link', {
				refreshToken: credentials.refreshToken,
				organizationId,
				project: projectSlug ?? assetId,
				repo_owner: repo.owner,
				repo_name: repo.repo,
				github_host: repo.host,
				default_branch: branch,
				...(rootDirectory ? { root_path: rootDirectory } : {})
			});
			await trackRotatedToken(credentials, res.refreshToken as string | undefined);
			s.stop(
				`Updated published branch (${branch})${rootDirectory ? ` + root (${rootDirectory})` : ''}`
			);
		} catch (e) {
			s.stop('Failed to update project binding');
			throw e;
		}
	}

	// ── Stage: access.yaml (code-managed access needs it on the published branch) ─
	await ensureAccessYaml(projectRoot, interactive);

	// ── Stage: GitHub App install + repo access ────────────────────────────────
	await ensureGithubInstalled(credentials, organizationId, repo, interactive);

	// ── Stage: warehouse credentials ───────────────────────────────────────────
	await maybeUploadCredentials(credentials, organizationId, projectRoot, options, interactive);

	// ── Stage: initial sync ────────────────────────────────────────────────────
	// Pull the repo's current HEAD into Studio directly — no empty-commit push
	// needed. Empty repos and missing branches are non-fatal (project is usable;
	// first real push will populate it via the normal webhook path).
	if (assetId) {
		const s = spinner();
		s.start('Syncing content from GitHub');
		try {
			const res = await postJson('/api/cli/projects/sync', {
				refreshToken: credentials.refreshToken,
				organizationId,
				assetId
			});
			await trackRotatedToken(credentials, res.refreshToken as string | undefined);
			const reason = res.reason as string | undefined;
			if (reason === 'EMPTY_REPO' || reason === 'BRANCH_NOT_FOUND') {
				s.stop('Nothing to sync yet — push your first commit to deploy');
			} else {
				s.stop('Content synced');
			}
		} catch {
			s.stop('Sync skipped — push a commit to deploy');
		}
	}

	// ── Done ───────────────────────────────────────────────────────────────────
	console.log('');
	console.log(`  ✓ ${repo.owner}/${repo.repo} is connected to Evidence Studio.`);
	if (projectSlug) console.log(`    Project: ${projectSlug}`);

	if (projectSlug) {
		console.log(`\n  View your project:\n`);
		console.log(`    ${STUDIO_HOST}/${projectSlug}\n`);
	} else {
		console.log('\n  Deploy your next change with:\n');
		console.log('    git add -A && git commit -m "Update report" && git push\n');
	}
	process.exit(0);
}

// Ensure the project root has an access.yaml so code-managed access resolves
// on the published branch. The user commits it alongside their content.
async function ensureAccessYaml(projectRoot: string, interactive: boolean): Promise<void> {
	const target = path.join(projectRoot, 'access.yaml');
	if (existsSync(target)) return;

	if (!interactive) {
		await writeFile(
			target,
			serializeAccessState({
				project: { restricted: true, grants: { users: [], groups: [] } },
				pages: []
			}),
			'utf-8'
		);
		console.log(
			'  • Added access.yaml (developers & admins only). Edit it to change who can view.'
		);
		return;
	}

	const choice = await select({
		message: 'Who should be able to view this project?',
		options: [
			{ value: 'admins', label: 'Just developers and admins', hint: 'default' },
			{ value: 'org', label: 'Everyone in my organization' },
			{ value: 'custom', label: 'Define a custom access.yaml' }
		]
	});
	if (isCancel(choice)) {
		cancel('Cancelled.');
		process.exit(1);
	}

	if (choice === 'custom') {
		// Write an admins-only starter and stop so the user can edit it before
		// committing — re-running launch picks up the now-present file.
		await writeFile(
			target,
			serializeAccessState({
				project: { restricted: true, grants: { users: [], groups: [] } },
				pages: []
			}),
			'utf-8'
		);
		console.log(
			'\n  Wrote a starter access.yaml. Edit it to define your rules, then commit + push'
		);
		console.log('  (or re-run `evidence launch`). Docs:');
		console.log('    https://docs.evidence.studio/features/page-level-access-control\n');
		process.exit(1);
	}

	await writeFile(
		target,
		serializeAccessState({
			project: { restricted: choice !== 'org', grants: { users: [], groups: [] } },
			pages: []
		}),
		'utf-8'
	);
	done(
		`access.yaml created (${choice === 'org' ? 'everyone in your org' : 'developers & admins'})`
	);
}

async function maybeUploadCredentials(
	credentials: StoredCredentials,
	organizationId: string,
	projectRoot: string,
	options: LaunchOptions,
	interactive: boolean
): Promise<void> {
	// loadConnectionConfig returns null only when connection.yaml is absent; an
	// invalid file (incl. unfilled `<placeholder>` values, now rejected by the
	// schema) throws — surface that instead of silently skipping the upload.
	let config: Awaited<ReturnType<typeof loadConnectionConfig>>;
	try {
		config = await loadConnectionConfig(projectRoot);
	} catch (e) {
		console.log('  • Skipping credential upload — connection.yaml is invalid:');
		console.log(`    ${(e as Error).message}`);
		return;
	}
	if (!config) {
		// No connection.yaml → Evidence-managed; nothing to upload.
		return;
	}

	// Uploading writes org-wide warehouse settings, so require an explicit opt-in:
	// a confirm in a TTY, or `--upload-credentials` in a non-interactive run. Never
	// upload silently from a pipeline.
	if (interactive) {
		const ok = await confirm({
			message: `Upload ${config.type} credentials from connection.yaml to Evidence Studio?`
		});
		if (isCancel(ok)) {
			cancel('Cancelled.');
			process.exit(1);
		}
		if (!ok) {
			console.log('  • Skipped credential upload. Add them in Studio settings later.');
			return;
		}
	} else if (!options.uploadCredentials) {
		console.log(
			'  • Skipping credential upload (non-interactive). Pass --upload-credentials to upload,'
		);
		console.log('    or add them in Studio → Settings → Warehouse.');
		return;
	}

	// Re-read after the confirm so edits made while the prompt was open win.
	let fresh: Awaited<ReturnType<typeof loadConnectionConfig>>;
	try {
		fresh = (await loadConnectionConfig(projectRoot)) ?? config;
	} catch (e) {
		console.log('  • Not uploading — connection.yaml is now invalid:');
		console.log(`    ${(e as Error).message}`);
		return;
	}

	const { type, ...credentialPayload } = fresh;
	const configPayload: Record<string, unknown> = {};
	if (type === 'bigquery') {
		configPayload.datasets = await readBigQueryDatasets(projectRoot);
	}

	const s = spinner();
	s.start(`Uploading ${type} credentials`);
	let res;
	try {
		res = await postJson('/api/cli/connections', {
			refreshToken: credentials.refreshToken,
			organizationId,
			type,
			credentials: credentialPayload,
			config: configPayload
		});
	} catch (e) {
		// Non-fatal — launch is still useful without warehouse credentials.
		s.stop(`${type} credential upload failed`);
		console.log(`    ${e instanceof Error ? e.message : String(e)}`);
		console.log(
			'  • Continuing without uploading. Add credentials in Studio → Settings → Warehouse.'
		);
		return;
	}
	await trackRotatedToken(credentials, res.refreshToken as string | undefined);
	s.stop(`${type} credentials uploaded`);
}

// The introspection dataset allowlist is dropped during credential resolution,
// so read it straight from connection.yaml for the upload's config payload.
async function readBigQueryDatasets(projectRoot: string): Promise<string[]> {
	try {
		const raw = await readFile(path.join(projectRoot, 'connection.yaml'), 'utf-8');
		const parsed = yaml.load(raw) as Record<string, unknown> | null;
		const datasets = parsed?.datasets;
		if (Array.isArray(datasets)) return datasets.map(String).filter(Boolean);
	} catch {
		// fall through to empty — the server returns a clear error
	}
	return [];
}
