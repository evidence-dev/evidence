import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'clock',
	category: 'ui',
	description: 'Display a live clock with running seconds and the current date',
	selfClosing: true,
	attributes: {
		format: {
			type: String,
			default: '12h',
			matches: ['12h', '24h'],
			description: 'Time format: 12-hour or 24-hour'
		},
		variant: {
			type: String,
			default: 'sans',
			matches: ['sans', 'mono'],
			description: 'Font variant: sans-serif or monospace'
		},
		align: {
			type: String,
			default: 'left',
			matches: ['left', 'right'],
			description: 'Text alignment'
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Default Clock (12h)',
			hero: true,
			example: '{% clock /%}'
		},
		{
			title: '24-Hour Clock',
			example: '{% clock format="24h" /%}'
		}
	]
} satisfies UserComponentSchema;
