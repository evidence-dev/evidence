import type { UserComponentSchema } from '../../types';
import { validateEmptyAttributes, validateVariablesInComponent, and } from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';

export const schema = {
	render: 'file',
	category: 'ui',
	keywords: ['attachment', 'download', 'document', 'pdf', 'excel', 'csv', 'upload', 'asset'],
	description:
		'Attach a downloadable file to a report as a card showing its icon, name, type, and date. Drop or paste a file into the editor to upload it to your organization and insert a file tag automatically.',
	selfClosing: true,
	validate: and(validateEmptyAttributes(), validateVariablesInComponent()),
	attributes: {
		url: {
			type: String,
			required: true,
			description:
				'The upload alias returned when a file is dropped into the editor (evd_...), or an external URL to link to.',
			supportsVariables: true,
			variableContext: 'text'
		},
		name: {
			type: String,
			required: false,
			description: 'Display name for the file. Defaults to the filename from the URL.',
			supportsVariables: true,
			variableContext: 'text'
		},
		type: {
			type: String,
			required: false,
			description:
				'File type label shown on the card (e.g. PDF, Excel). Inferred from the file extension when omitted.',
			supportsVariables: true,
			variableContext: 'text'
		},
		date: {
			type: String,
			required: false,
			description:
				'Date shown on the card, e.g. the upload date. Accepts YYYY-MM-DD, an ISO timestamp, or free text.',
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'fit',
		noCard: true,
		flex: {
			grow: 1,
			minWidth: 220,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% file
    url="https://files.example.com/reports/q3-board-deck.pdf"
    name="Q3 Board Deck.pdf"
    date="2026-09-29"
/%}
`
		},
		{
			title: 'Uploaded File',
			example: `
{% file
    url="evd_org_01ABC/k7Xq2mB9.xlsx"
    name="Regional Sales Model.xlsx"
    date="2026-09-29"
/%}
`
		}
	]
} satisfies UserComponentSchema;
