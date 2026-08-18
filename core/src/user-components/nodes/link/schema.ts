import type { UserComponentSchema } from '../../types';
import { and } from '../../validators';
import { isTreePath } from '../../validators/isTreePath';
import { isUrl } from '../../validators/isUrl';
import { or } from '../../validators/or';
import { startsWith } from '../../validators/startsWith';

export const schema = {
	render: 'link',
	category: 'ui',
	description: 'Link to another page in Evidence or an external location',
	examples: [
		{
			title: 'Basic usage',
			hero: true,
			example: `
[Link Text](href)
`
		},
		{
			title: 'Link to another Evidence page',
			example: `
<!-- Root page, not in a folder -->
[My Other Page](/project-slug/page-slug)

<!-- Page within a folder -->
[My Other Page](/project-slug/folder-slug/page-slug)

<!-- Page nested depply within folders -->
[My Other Page](/project-slug/folder1-slug/folder2-slug/page-slug)
`
		},
		{
			title: 'Link to an external site',
			example: `
[My External Site](https://example.com)
`
		}
	],
	selfClosing: false,
	attributes: {
		href: {
			type: String,
			description:
				'Either an absolute URL to link to an external page, or a path to an Evidence page in the format `/<projectSlug>/<...folderSlugs>/<pageSlug>`',
			required: true
		}
	},
	// `#fragment` is standard markdown for a same-page anchor — allowed even
	// though headings don't emit ids yet, so it can't be a hard error.
	validate: or(and(startsWith('href', '/'), isTreePath('href')), isUrl('href'), startsWith('href', '#')),
	componentWrapper: {
		display: 'inline'
	}
} as const satisfies UserComponentSchema;
