import { isValidationContext, type Validator } from './types';
import { resolvePartialFile } from '../common/resolve-reference';

export const partialFileExists =
	(partialNameAttribute: string): Validator =>
	(node, config, context) => {
		if (!isValidationContext(context)) return [];

		const partialFile = node.attributes[partialNameAttribute];
		if (!partialFile || typeof partialFile !== 'string') return [];

		// Resolve "from here / from root" to the full-path key (new model);
		// returns the value unchanged for legacy projects.
		const resolvedFile = resolvePartialFile(partialFile, node, config);

		// Check if the partial exists in the config's partials
		const partials = config?.partials;
		if (partials && resolvedFile in partials) return [];

		// Project-root projects resolve references "from here" — so a
		// reference like "partials/foo" inside `pages/home` resolves to
		// `pages/partials/foo`, which never matches the actual map key
		// `partials/foo`. The most common agent mistake is to write that
		// relative form thinking it's absolute. If the literal input (or
		// the input with a leading slash stripped) IS a valid map key,
		// the user wanted the absolute form — suggest the leading-slash
		// version unambiguously so the fix is actionable.
		const useRelativeResolution = (config as { evidenceUseRelativeResolution?: boolean })
			?.evidenceUseRelativeResolution;
		if (partials && useRelativeResolution) {
			const stripped = partialFile.replace(/^\/+/, '');
			if (stripped in partials) {
				return [
					{
						id: 'invalid-partial',
						level: 'error',
						message: `${partialNameAttribute}: Partial "${partialFile}" does not exist at this relative path (resolved to "${resolvedFile}"). Use the absolute form "/${stripped}" instead — leading slash means "from the project root".`,
						location: node.location
					}
				];
			}
		}

		const fullyQualifiedPartial = Object.keys(partials || {}).find((partial) =>
			partial.includes(partialFile)
		);
		if (fullyQualifiedPartial) {
			// If the matched key is exactly the input string (i.e. the
			// user IS referencing a real partial, they just need the
			// absolute form in a project-root project), make the
			// suggestion unambiguous by leading with the slash. Otherwise
			// suggest the key as-is.
			const suggestion =
				useRelativeResolution && fullyQualifiedPartial === partialFile
					? `/${fullyQualifiedPartial}`
					: fullyQualifiedPartial;
			return [
				{
					id: 'invalid-partial',
					level: 'error',
					message: `${partialNameAttribute}: Partial "${partialFile}" does not exist. Did you mean "${suggestion}"?`,
					location: node.location
				}
			];
		}

		return [
			{
				id: 'invalid-partial',
				level: 'error',
				message: `${partialNameAttribute}: Partial "${partialFile}" does not exist`,
				location: node.location
			}
		];
	};
