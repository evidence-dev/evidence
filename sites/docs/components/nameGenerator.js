let counter = 0;
export const nameGenerator = (name, idName, names) => {
	idName = name.replace(/[^a-zA-Z0-9]/g, '-');
	while (names.has(idName)) {
		counter++;
		idName = counter > 1 ? `${name}-${counter}` : `${name}`;
	}
	names.add(idName);
};
