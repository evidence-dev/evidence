import { confirm, text, isCancel, cancel } from '@clack/prompts';
import {
	resolveCredentials,
	resolveOrganization,
	postJson,
	trackRotatedToken
} from './cli-shared.ts';
import {
	detectRepoOwnerName,
	detectDefaultBranch,
	detectCurrentBranch,
	detectRootPath
} from './git-detect.ts';
import { ensureGithubInstalled } from './launch.ts';

interface LinkOptions {
	project?: string | null;
	branch?: string | null;
	rootDirectory?: string | null;
}

// Attach this repo to an EXISTING Studio project. The project's content becomes
// git-managed: the next `git push` overwrites it with the repo's contents.
export async function link(options: LinkOptions = {}): Promise<void> {
	const projectRoot = process.cwd();
	const interactive = Boolean(process.stdin.isTTY);

	const credentials = await resolveCredentials();

	const repo = await detectRepoOwnerName(projectRoot);
	if (!repo) {
		console.error('\n  `evidence link` needs a git repository with a GitHub `origin` remote.\n');
		process.exit(1);
	}

	const organizationId = await resolveOrganization(credentials);

	let project = options.project ?? null;
	if (!project) {
		if (!interactive) {
			console.error('\n  Pass the project to link with `--project <slug|id>`.\n');
			process.exit(1);
		}
		const answer = await text({ message: 'Existing Studio project (slug or id)' });
		if (isCancel(answer)) {
			cancel('Cancelled.');
			process.exit(1);
		}
		project = (answer as string).trim();
		if (!project) {
			console.error('\n  A project slug or id is required.\n');
			process.exit(1);
		}
	}

	const branch =
		options.branch ??
		(await detectDefaultBranch(projectRoot)) ??
		(await detectCurrentBranch(projectRoot)) ??
		'main';
	const rootDirectory =
		options.rootDirectory ?? (await detectRootPath(projectRoot, projectRoot)) ?? '';

	if (interactive) {
		console.log(
			`\n  Linking ${repo.owner}/${repo.repo} to "${project}" makes the repo the source of truth.`
		);
		console.log("  The next `git push` will overwrite that project's current Studio content.\n");
		const ok = await confirm({ message: 'Continue?' });
		if (isCancel(ok) || !ok) {
			cancel('Cancelled.');
			process.exit(1);
		}
	}

	const res = await postJson('/api/cli/projects/link', {
		refreshToken: credentials.refreshToken,
		organizationId,
		project,
		github_host: repo.host,
		repo_owner: repo.owner,
		repo_name: repo.repo,
		default_branch: branch,
		...(rootDirectory ? { root_path: rootDirectory } : {})
	});
	await trackRotatedToken(credentials, res.refreshToken as string | undefined);

	const slug = (res.slug as string | undefined) ?? project;
	console.log(`  ✓ Linked ${repo.owner}/${repo.repo} → "${slug}"`);

	await ensureGithubInstalled(credentials, organizationId, repo, interactive);

	console.log('\n  Push to overwrite the project with your local content:\n');
	console.log('    git add -A && git commit -m "Sync to Studio" && git push\n');
	process.exit(0);
}
