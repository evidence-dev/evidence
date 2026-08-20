import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'logo',
	category: 'ui',
	description: 'Display a company logo from logo.dev',
	selfClosing: true,
	attributes: {
		domain: {
			type: String,
			required: true,
			description: 'Company domain (e.g., "stripe.com")',
			supportsVariables: true,
			variableContext: 'text'
		},
		size: {
			type: String,
			required: false,
			default: 'base',
			description: 'Logo size: sm, base, lg, xl'
		},
		grayscale: {
			type: Boolean,
			required: false,
			default: false,
			description: 'Display logo in grayscale'
		},
		alt: {
			type: String,
			required: false,
			description: 'Alt text (defaults to domain)',
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: '{% logo domain="stripe.com" /%}'
		},
		{
			title: 'Large Size',
			example: '{% logo domain="github.com" size="lg" /%}'
		},
		{
			title: 'Inside a Header',
			example: '# {% logo domain="stripe.com" size="sm" /%} Stripe Report'
		}
	]
} as const satisfies UserComponentSchema;
