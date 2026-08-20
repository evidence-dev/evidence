import type { Validator } from './types';

export const hasChild =
	(acceptableChildren?: string[]): Validator =>
	(node) => {
		if (!node.children.length) {
			return [
				{
					id: 'missing-children',
					level: 'error' as const,
					message: `At least one child component is required${acceptableChildren?.length ? `. One of ${acceptableChildren?.join(', ')}` : ''}`,
					location: node.location
				}
			];
		}

		return [];
	};
