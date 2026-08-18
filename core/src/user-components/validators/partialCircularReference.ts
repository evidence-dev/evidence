import { isValidationContext, type Validator } from './types';
import type { Node, Config } from '@markdoc/markdoc';
import {
	dirOfPath,
	resolvePartialFile,
	resolveProjectReference,
	type ReferenceResolutionConfig
} from '../common/resolve-reference';

// Function to detect circular references in partials configuration
function detectCircularReferences(
	partials: Record<string, Node | Node[]>,
	partialFile: string,
	useRelativeResolution: boolean
): string[] | null {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function dfs(currentPartial: string): string[] | null {
		if (recursionStack.has(currentPartial)) {
			// Found a circular reference
			const cycle = Array.from(recursionStack);
			const cycleStart = cycle.indexOf(currentPartial);
			return cycle.slice(cycleStart);
		}

		if (visited.has(currentPartial)) {
			return null; // Already processed, no cycle
		}

		visited.add(currentPartial);
		recursionStack.add(currentPartial);

		// Check if this partial references other partials. In the new model, refs
		// inside a partial resolve "from here" relative to that partial's own dir.
		const partialContent = partials[currentPartial];
		if (partialContent) {
			const baseDir = useRelativeResolution ? dirOfPath(currentPartial) : '';
			const partialRefs = findPartialReferences(partialContent).map((ref) =>
				useRelativeResolution ? resolveProjectReference(ref, baseDir) : ref
			);

			for (const ref of partialRefs) {
				if (ref in partials) {
					const cycle = dfs(ref);
					if (cycle) {
						recursionStack.delete(currentPartial);
						return cycle;
					}
				}
			}
		}

		recursionStack.delete(currentPartial);
		return null;
	}

	const cycle = dfs(partialFile);
	return cycle;
}

// Helper function to find partial references in a node
function findPartialReferences(node: Node | Node[]): string[] {
	const refs: string[] = [];

	if (Array.isArray(node)) {
		for (const childNode of node) {
			refs.push(...findPartialReferences(childNode));
		}
		return refs;
	}

	if (node && typeof node === 'object') {
		// Check if this is a partial tag
		if (node.tag === 'partial' && node.attributes?.file) {
			refs.push(node.attributes.file);
		}

		// Recursively check children
		if (node.children) {
			for (const child of node.children) {
				refs.push(...findPartialReferences(child));
			}
		}
	}

	return refs;
}

export const partialCircularReference =
	(): Validator => (node: Node, config: Config, context: unknown) => {
		if (!isValidationContext(context)) return [];

		const partialFile = node.attributes.file;
		if (!partialFile || typeof partialFile !== 'string') return [];

		const useRelativeResolution = Boolean(
			(config as ReferenceResolutionConfig)?.evidenceUseRelativeResolution
		);
		const startPartial = resolvePartialFile(partialFile, node, config as ReferenceResolutionConfig);

		// Check for circular references in the partials configuration
		const partials = config?.partials;
		if (partials) {
			const cycle = detectCircularReferences(partials, startPartial, useRelativeResolution);
			if (cycle) {
				return [
					{
						id: 'circular-reference',
						level: 'error',
						message: `Circular reference: partial "${partialFile}" is part of a circular dependency chain`,
						location: node.location
					}
				];
			}
		}

		return [];
	};
