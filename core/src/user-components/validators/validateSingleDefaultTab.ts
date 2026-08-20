import type { Validator } from './types';

export const validateSingleDefaultTab: Validator = (node, _config, _context) => {
	if (node.tag !== 'tabs') return [];

	const defaultTabs = node.children.filter(
		(child) => child.type === 'tag' && child.tag === 'tab' && child.attributes?.default === true
	);

	if (defaultTabs.length > 1) {
		return [
			{
				id: 'multiple-default-tabs',
				level: 'warning',
				message: 'Only one tab should specify default=true',
				location: node.location
			}
		];
	}

	return [];
};