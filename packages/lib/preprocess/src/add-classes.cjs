const selector = require('hast-util-select');

const { selectAll } = selector;

/**
 * @param {Record<string, string>} additions
 * @returns {(node: import("hast").Element) => void}
 */
module.exports = (additions) => {
	const adders = Object.entries(additions).map(adder);
	return (node) => adders.forEach((a) => a(node));
};

/**
 * @param {[string, string]} entry
 * @returns {(node: import("hast").Element) => void}
 */
const adder = ([selector, className]) => {
	const writer = write(className);
	return (node) => selectAll(selector, node).forEach(writer);
};

/**
 * @param {string} className
 * @returns {(node: import("hast").Element) => void}
 */
const write = (className) => {
	return ({ properties }) => {
		if (!properties) return;
		if (!properties.className) properties.className = className;
		else properties.className += ` ${className}`;
	};
};
