import { describe, it, expect } from 'vitest';
import type { Config, Node } from '@markdoc/markdoc';
import { isTreePath } from './isTreePath';
import type { ValidationContext } from './types';
import type { ProjectTree } from '../interfaces/project-tree';

/**
 * Tests for `isTreePath`, the validator that powers Markdoc link href
 * validation in the editor. The relevant regression these tests guard
 * against is the editor reporting "page does not exist" for pages that
 * exist only on a working branch — which happens when the layout passes
 * a `trees` resolved against the wrong branch.
 *
 * `isTreePath` is pure: it walks whatever `trees` it is handed in the
 * `ValidationContext`. So testing the validator with a tree that contains
 * a "branch-only" page is sufficient to prove the validator itself is
 * branch-agnostic — the bug class is fully on the caller (the layout
 * loader) to pass branch-correct trees.
 */

function makeNode(href: string): Node {
	return {
		attributes: { href },
		location: { start: { line: 1 }, end: { line: 1 } }
	} as unknown as Node;
}

function makeContext(trees: ProjectTree[] | undefined): ValidationContext {
	return {
		metadata: undefined,
		filters: undefined,
		inlineQueries: undefined,
		trees
	};
}

const config = {} as Config;

const sampleTree: ProjectTree = {
	project: {
		id: 1,
		name: 'Sample',
		slug: 'sample',
		organizationId: 'org_1'
	},
	entries: [
		{
			type: 'directory',
			entry: { id: 'root', name: 'root', slug: null },
			children: [
				{ type: 'page', entry: { id: 'p1', name: 'Home', slug: 'home' } },
				{
					type: 'directory',
					entry: { id: 'd1', name: 'Sales', slug: 'sales' },
					children: [{ type: 'page', entry: { id: 'p2', name: 'Overview', slug: 'overview' } }]
				}
			]
		}
	]
};

describe('isTreePath', () => {
	const validate = isTreePath('href');

	it('returns no errors when href points at a top-level page in the tree', () => {
		const errors = validate(makeNode('/sample/home'), config, makeContext([sampleTree]));
		expect(errors).toEqual([]);
	});

	it('returns no errors when href points at a nested page in the tree', () => {
		const errors = validate(makeNode('/sample/sales/overview'), config, makeContext([sampleTree]));
		expect(errors).toEqual([]);
	});

	it('flags an unknown project slug', () => {
		const errors = validate(makeNode('/other/home'), config, makeContext([sampleTree]));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-link-href');
		expect(errors[0].message).toContain("`other` doesn't match a project");
	});

	it('flags an unknown page slug within a known project', () => {
		const errors = validate(makeNode('/sample/missing-page'), config, makeContext([sampleTree]));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-link-href');
		expect(errors[0].message).toContain('no page or folder named `missing-page`');
	});

	/**
	 * Branch-only page case. The tree handed to the validator is the only
	 * source of truth — when callers pass a branch-correct tree (i.e. the
	 * editor's current branch, not the project's published branch), pages
	 * that exist only on that branch must validate clean.
	 */
	it('accepts a page that exists only on a non-published branch when the supplied tree includes it', () => {
		const branchTree: ProjectTree = {
			project: { ...sampleTree.project },
			entries: [
				{
					type: 'directory',
					entry: { id: 'root', name: 'root', slug: null },
					children: [
						{
							type: 'page',
							entry: { id: 'pb', name: 'Branch Only', slug: 'branch-only-page' }
						}
					]
				}
			]
		};

		const errors = validate(
			makeNode('/sample/branch-only-page'),
			config,
			makeContext([branchTree])
		);
		expect(errors).toEqual([]);
	});

	/**
	 * Counter-case proving the same href fails when the supplied tree does
	 * not contain that page (the bug the layout-loader fix removes).
	 */
	it('flags a branch-only page when given the published tree (regression case)', () => {
		const errors = validate(
			makeNode('/sample/branch-only-page'),
			config,
			makeContext([sampleTree])
		);
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-link-href');
	});

	it('flags an unknown project when trees is an empty array', () => {
		// An empty `trees` array is treated as "trees were loaded but no
		// project matched", so the project-slug lookup fails the same way it
		// would for any other unknown slug. This contract matters because
		// callers must distinguish "validator skipped" (trees omitted) from
		// "validator ran and found nothing" (empty array).
		const errors = validate(makeNode('/sample/home'), config, makeContext([]));
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-link-href');
		expect(errors[0].message).toContain("`sample` doesn't match a project");
	});

	it('skips validation entirely when trees is undefined (validator is permissive)', () => {
		// `trees: undefined` means "the validator could not be run" (e.g.
		// SSR not yet hydrated). The validator must not flag the link in
		// that case — see `isTreePath.ts` early return.
		const errors = validate(makeNode('/sample/home'), config, makeContext(undefined));
		expect(errors).toEqual([]);
	});
});
