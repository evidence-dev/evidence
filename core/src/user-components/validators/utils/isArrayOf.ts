type OfType = {
	biging: bigint;
	boolean: boolean;
	number: number;
	object: object;
	string: string;
	symbol: symbol;
	undefined: undefined;
};

export const isArrayOf = <Type extends keyof OfType>(
	x: unknown,
	type: Type
): x is OfType[Type][] => {
	return Array.isArray(x) && x.every((item) => typeof item === type);
};
