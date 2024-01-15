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

/**
 * @param {{ name: string; evidenceType: string }[]} columns
 * @returns {number}
 */
export function evidenceColumnsToScore(columns: { name: string; evidenceType: string }[]): number;

/**
 *
 * @param {string} column_type
 * @returns {'number' | 'boolean' | 'string' | 'date'}
 */
export function duckdbTypeToEvidenceType(
	column_type: string
): 'number' | 'boolean' | 'string' | 'date';
