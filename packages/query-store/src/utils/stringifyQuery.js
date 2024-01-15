/**
 * Stringify provided query and add comment if provided
 * If comment is multiline, add '--' before each line
 *
 * @param {string} q - Query that needs to be stringified
 * @param {string} comment - Comment that needs to be added to the query
 * @returns {string} Stringified query with a comment if provided
 */
export const stringifyQuery = (q, comment) => {
	let output = '';
	if (comment) output += `-- ${comment.split('\n').join('\n-- ')}\n`;
	output += q;
	return output;
};
