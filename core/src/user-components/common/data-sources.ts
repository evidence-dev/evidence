import type { Validator } from '../validators/types';

/**
 * One valid arrangement of attributes for a component. A component's
 * `dataSources` declares every legal shape it supports; the runner errors when
 * none matches, so per-component XOR/co-dep lambdas are unnecessary.
 *
 *  - `requires`: every named attribute must be present on the node.
 *  - `forbids`: no named attribute may be present on the node.
 *
 * A match means all `requires` are present AND none of `forbids` are — one
 * matching entry is enough to pass. Empty `requires` means the entry matches
 * whenever none of `forbids` are set (use for a legal "empty" shape).
 */
export type DataSource = {
	requires: readonly string[];
	forbids: readonly string[];
};

const hasAttr = (attrs: Record<string, unknown>, name: string): boolean => {
	const v = attrs[name];
	if (v === undefined || v === null) return false;
	if (typeof v === 'string' && v === '') return false;
	if (Array.isArray(v) && v.length === 0) return false;
	return true;
};

const matches = (attrs: Record<string, unknown>, source: DataSource): boolean =>
	source.requires.every((a) => hasAttr(attrs, a)) &&
	source.forbids.every((a) => !hasAttr(attrs, a));

/**
 * Human-readable "requires X + Y" fragment for one entry, used to build the
 * "Set X + Y, or Z" error when no entry matches.
 */
const describe = (source: DataSource): string => {
	const req = source.requires.map((a) => `\`${a}\``).join(' + ');
	if (req && source.forbids.length === 0) return req;
	if (req) return `${req} (without ${source.forbids.map((a) => `\`${a}\``).join('/')})`;
	if (source.forbids.length === 0) return '(no source attributes)';
	return `no source attributes (omit ${source.forbids.map((a) => `\`${a}\``).join('/')})`;
};

/**
 * Validator that enforces the declared `dataSources`: at least one arrangement
 * must fully match. Auto-generates an error listing the legal options, so
 * components don't need to hand-write the message.
 */
export const validateDataSources =
	(sources: readonly DataSource[]): Validator =>
	(node) => {
		const attrs = (node.attributes ?? {}) as Record<string, unknown>;
		if (sources.some((s) => matches(attrs, s))) return [];
		const options = sources.map(describe).join(', or ');
		return [
			{
				id: 'invalid-data-source',
				level: 'error',
				message: `Set ${options}.`,
				location: node.location
			}
		];
	};
