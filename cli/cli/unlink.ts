import { confirm, text, isCancel, cancel } from '@clack/prompts';
import {
	resolveCredentials,
	resolveOrganization,
	postJson,
	trackRotatedToken
} from './cli-shared.ts';
import { detectRepoOwnerName } from './git-detect.ts';
import { githubStatus } from './launch.ts';

interface UnlinkOptions {
	project?: string | null;
}

// Disconnect this repo from its Studio project: clears the project's repo
// binding server-side. Leaves the org's GitHub App install and the project
// itself intact.
export async function unlink(options: UnlinkOptions = {}): Promise<void> {
	const projectRoot = process.cwd();
	const interactive = Boolean(process.stdin.isTTY);

	const credentials = await resolveCredentials();

	const organizationId = await resolveOrganization(credentials);

	// Infer the project from this repo's server-side binding when not passed.
	let project = options.project ?? null;
	if (!project) {
		const repo = await detectRepoOwnerName(projectRoot);
		if (repo) {
			const status = await githubStatus(credentials, organizationId, repo);
			if (status.linkedProject) project = status.linkedProject.slug;
		}
	}
	if (!project) {
		if (!interactive) {
			console.error('\n  Pass the project to unlink with `--project <slug|id>`.\n');
			process.exit(1);
		}
		const answer = await text({ message: 'Studio project to unlink (slug or id)' });
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

	if (interactive) {
		const ok = await confirm({ message: 'Disconnect this repo from its Studio project?' });
		if (isCancel(ok) || !ok) {
			cancel('Cancelled.');
			process.exit(1);
		}
	}

	const res = await postJson('/api/cli/projects/unlink', {
		refreshToken: credentials.refreshToken,
		organizationId,
		project
	});
	await trackRotatedToken(credentials, res.refreshToken as string | undefined);

	const slug = (res.slug as string | undefined) ?? project;
	console.log(`\n  ✓ Disconnected "${slug}" from its repo.`);
	console.log('    The project still exists in Studio; pushes no longer deploy to it.\n');
	process.exit(0);
}
