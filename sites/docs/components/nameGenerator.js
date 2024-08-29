export const nameGenerator = (name, names) => {
	let idName = name.replace(/[^a-zA-Z0-9]/g, '-');
	let counter = 0;
	while (names.has(idName)) {
		counter++;
		idName = counter > 1 ? `${name}-${counter}` : `${name}`;
	}
	names.add(idName);
	counter = 0;
	return idName;
};
