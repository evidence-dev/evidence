const selector = require('hast-util-select');

const { selectAll } = selector;

module.exports = (additions) => {
	const adders = Object.entries(additions).map(adder);
	return (node) => adders.forEach((a) => a(node));
};

const adder = ([selector, className]) => {
	const writer = write(className);
	return (node) => selectAll(selector, node).forEach(writer);
};

const write = (className) => {
	return ({ properties }) => {
		if (!properties.className) properties.className = className;
		else properties.className += ` ${className}`;
	};
};
