import merge from 'lodash/merge';

const getStartToken = (value) => (Array.isArray(value) ? '[' : '{');
const getEndToken = (value) => (Array.isArray(value) ? ']' : '}');

/**
 * @param {import("@evidence-dev/sdk/utils").Diff} diff
 */
export function formatDiff(diff) {
	const output = [];
	const beforeStartToken = getStartToken(diff.before);
	const afterStartToken = getStartToken(diff.after);

	if (beforeStartToken === afterStartToken) {
		output.push({ content: beforeStartToken, type: 'unchanged' });
	} else {
		output.push({ content: beforeStartToken, type: 'deleted' });
		output.push({ content: afterStartToken, type: 'added' });
	}

	const unified = merge(diff.before, diff.after);

	function getAtPath(obj, path) {
		return path.reduce((o, k) => o?.[k], obj);
	}
	function recurse(merged, path) {
		const keys = Object.keys(merged);
		const parentIsArray = Array.isArray(getAtPath(diff.after, path));
		keys.forEach((key, i) => {
			const addedAt = getAtPath(diff.added, path) ?? {};
			const deletedAt = getAtPath(diff.deleted, path) ?? {};
			const updatedAt = getAtPath(diff.updated, path) ?? {};
			const isArray = Array.isArray(getAtPath(diff.after, [...path, key]));

			let lineType = 'unchanged';

			if (key in addedAt) lineType = 'added';
			if (key in deletedAt) lineType = 'deleted';
			if (key in updatedAt) lineType = 'updated';

			const buildLineText = (val, excludeKey = false) => {
				const keyText = `"${key}": `;
				let lineContent = `${'  '.repeat(path.length + 1)}${excludeKey ? '' : keyText}${val}`;
				if (i < keys.length - 1) {
					lineContent += ',';
				}
				return lineContent;
			};

			if (typeof merged[key] === 'object') {
				// TODO: Still need to add the line in this case
				const startToken = isArray ? '[' : '{';
				const endToken = isArray ? ']' : '}';

				output.push({
					type: lineType === 'updated' ? 'unchanged' : lineType,
					content: buildLineText(startToken, typeof path.at(-1) === 'number' || parentIsArray)
				});
				recurse(merged[key], path.concat(parentIsArray ? i : key));
				output.push({
					type: lineType === 'updated' ? 'unchanged' : lineType,
					content: buildLineText(endToken, true)
				});
				return;
			} else {
				const value = lineType === 'deleted' ? getAtPath(diff.before, path)[key] : merged[key];
				output.push({
					type: lineType,
					content: buildLineText(JSON.stringify(value), parentIsArray)
				});
				return;
			}
		});
	}

	recurse(unified, []);
	const beforeEndToken = getEndToken(diff.before);
	const afterEndToken = getEndToken(diff.after);

	if (beforeEndToken === afterEndToken) {
		output.push({ content: beforeEndToken, type: 'unchanged' });
	} else {
		output.push({ content: beforeEndToken, type: 'deleted' });
		output.push({ content: afterEndToken, type: 'added' });
	}

	return output;
}
