import merge from 'lodash/merge';

/**
 *
 * @param {import("@evidence-dev/sdk/utils").Diff} diff
 */
export function formatDiff(diff) {
	const output = [{ type: 'unchanged', content: '{' }];
	const unified = merge(diff.before, diff.after);

	function getAtPath(obj, path) {
		return path.reduce((o, k) => o?.[k], obj);
	}
	function recurse(merged, path) {
		const keys = Object.keys(merged);
		keys.forEach((key, i) => {
			const addedAt = getAtPath(diff.added, path) ?? {};
			const deletedAt = getAtPath(diff.deleted, path) ?? {};
			const updatedAt = getAtPath(diff.updated, path) ?? {};
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
				output.push({
					type: lineType === 'updated' ? 'unchanged' : lineType,
					content: buildLineText(`{`)
				});
				recurse(merged[key], path.concat(key));
				output.push({
					type: lineType === 'updated' ? 'unchanged' : lineType,
					content: buildLineText('}', true)
				});
				return;
			} else {
				const value = lineType === 'deleted' ? getAtPath(diff.before, path)[key] : merged[key];
				output.push({
					type: lineType,
					content: buildLineText(JSON.stringify(value))
				});
				return;
			}
		});
	}

	recurse(unified, []);
	output.push({ type: 'unchanged', content: '}' });

	return output;
}
