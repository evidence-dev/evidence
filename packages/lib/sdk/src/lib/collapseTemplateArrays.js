/**
 * @param {TemplateStringsArray} strs
 * @param {unknown[]} args
 */
export const collapseTemplateArrays = (strs, args) => {
	return strs.map((s, i) => s + (args[i] ?? '')).join('');
};
