import type { ProjectTreeEntry } from '../interfaces/project-tree';
import { isValidationContext, type Validator } from './types';

export const isTreePath =
	(attributeName: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];
		const { trees } = context;
		if (!trees) return [];

		const attributeValue = node.attributes[attributeName];
		if (typeof attributeValue !== 'string') return [];

		const [projectSlug, ...rawParts] = attributeValue.split('/').filter((part) => part !== '');
		const parts = [null, ...rawParts]; // add null part for root directory slug

		if (!projectSlug) {
			const example = trees?.[0]?.project.slug ?? '<project>';
			return [
				{
					id: 'invalid-link-href',
					level: 'error',
					message: `Invalid link: links to project pages start with the project name from the URL — e.g. \`/${example}/my-page\``,
					location: node.location
				}
			];
		}

		const project = trees?.find(({ project }) => project.slug === projectSlug);
		if (!project) {
			return [
				{
					id: 'invalid-link-href',
					level: 'error',
					message: `Invalid link: \`${projectSlug}\` doesn't match a project. Links start with the project name from the URL${trees?.[0] ? ` — e.g. \`/${trees[0].project.slug}/my-page\`` : ''}`,
					location: node.location
				}
			];
		}

		let lastEntry: ProjectTreeEntry | undefined;
		let entries = project.entries;
		for (const [i, part] of parts.entries()) {
			const next = entries.find((entry) => entry.entry.slug === part);

			// Return error if we cant find the next part
			if (!next) {
				const pathUntilNow = [projectSlug, ...parts].slice(0, i).join('/');
				return [
					{
						id: 'invalid-link-href',
						level: 'error',
						message: `Invalid link: no page or folder named \`${part}\` under \`${pathUntilNow}\``,
						location: node.location
					}
				];
			}

			if (next.type === 'directory') {
				entries = next.children;
			}

			if (next.type === 'page') {
				entries = [];
			}

			lastEntry = next;
		}

		// Link path must end at a page
		if (lastEntry && lastEntry.type !== 'page') {
			return [
				{
					id: 'invalid-link-href',
					level: 'error',
					message: 'Invalid link: this path ends at a folder — link to a page inside it',
					location: node.location
				}
			];
		}

		return [];
	};
