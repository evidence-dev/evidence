import type { Tag, ValidateError } from '@markdoc/markdoc';

export const doesValidateErrorApplyToTag = (tag: Tag, error: ValidateError): boolean => {
	const isNodeFromAnotherFile = Boolean(tag.location?.file);
	return Boolean(
		// We don't want to show validation errors for components from partials because their line numbers will be wrong!
		!isNodeFromAnotherFile &&
			tag.lines &&
			((error.type === 'tag' &&
				error.lines?.[0] === tag.lines[0] &&
				error.lines?.[1] === tag.lines[1]) ||
				(error.lines?.[0] >= tag.lines[0] && error.lines?.[1] <= tag.lines[3]))
	);
};
