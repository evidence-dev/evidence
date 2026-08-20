// `evidence init` scaffolds connection.yaml with `<placeholder>` values for the
// required non-secret fields. They satisfy a bare `.min(1)`, so without this
// guard a user could publish an unfilled template. Applied only to non-secret
// identifier fields — never to passwords/keys, which may legitimately contain
// angle brackets.

export const PLACEHOLDER_MESSAGE =
	'looks like an unfilled <placeholder> from `evidence init` — replace it with a real value';

export function notTemplatePlaceholder(value: string): boolean {
	return !/^<.*>$/.test(value.trim());
}
