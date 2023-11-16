/**
 * @param {{ name: string; type: string }[]} columns
 * @returns {number}
 */
export function columnsToScore(
	columns: {
		name: string;
		type: string;
	}[]
): number;
