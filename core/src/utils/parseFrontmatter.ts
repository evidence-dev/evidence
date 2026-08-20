import yaml, { YAMLException } from 'js-yaml';
import type { ValidateError } from '@markdoc/markdoc';

export interface ParseFrontmatterResult {
	frontmatter: Record<string, unknown>;
	errors: ValidateError[];
}

/**
 * Safely parses YAML frontmatter string into a Record<string, unknown>
 * Returns both the parsed frontmatter and any validation errors
 */
export function parseFrontmatter(frontmatter: string | undefined): ParseFrontmatterResult {
	if (!frontmatter) {
		return { frontmatter: {}, errors: [] };
	}

	try {
		const parsed = yaml.load(frontmatter) as Record<string, unknown>;
		return { frontmatter: parsed, errors: [] };
	} catch (error) {
		// Create validation error for YAML parsing failure
		const yamlException = error as YAMLException;
		const yamlError: ValidateError = {
			type: 'text',
			lines: [
				yamlException.mark?.line ? yamlException.mark.line + 1 : 0,
				yamlException.mark?.line ? yamlException.mark.line + 2 : 0
			],
			location: {
				start: {
					line: yamlException.mark?.line ? yamlException.mark.line + 1 : 0,
					character: undefined
				},
				end: {
					line: yamlException.mark?.line ? yamlException.mark.line + 2 : 0,
					character: undefined
				}
			},
			error: {
				id: 'yaml-parse-error',
				level: 'error',
				message: `Invalid frontmatter YAML: ${yamlException.message}`
			}
		};

		return { frontmatter: {}, errors: [yamlError] };
	}
}
