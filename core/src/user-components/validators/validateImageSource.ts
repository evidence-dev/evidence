import type { Validator } from './types';

const QUERY_ONLY_ATTRIBUTES = [
	'column',
	'dark_column',
	'description_column',
	'filters',
	'where',
	'order',
	'limit',
	'qualify',
	'refresh_interval'
] as const;

/**
 * The image tag has two mutually exclusive sources: a static `url` or a
 * `data` + `column` query. Enforces exactly one source and that alt text is
 * available (`description` or `description_column`). Presence-only checks, so
 * it needs no metadata and never false-positives on variable values.
 */
export const validateImageSource = (): Validator => (node) => {
	const has = (attr: string): boolean => node.attributes[attr] !== undefined;

	const errors: ReturnType<Validator> = [];
	const error = (message: string) =>
		errors.push({
			id: 'invalid-image-source',
			level: 'error' as const,
			message,
			location: node.location
		});

	// Truthy, not presence: matches the model's isDataDriven so `data=""` gets
	// static-mode messages (validateEmptyAttributes flags the empty string itself).
	if (node.attributes['data']) {
		if (has('url')) error('url: Cannot be combined with data — use column to load the URL');
		if (has('dark_url')) error('dark_url: Cannot be combined with data — use dark_column instead');
		if (!has('column')) error('column: Required when data is provided');
		if (!has('description') && !has('description_column'))
			error('description: Provide description or description_column for the image alt text');
	} else {
		if (!has('url')) error('url: Required unless data is provided');
		if (!has('description')) error('description: Required');
		for (const attr of QUERY_ONLY_ATTRIBUTES) {
			if (has(attr)) error(`${attr}: Requires data`);
		}
	}

	return errors;
};
