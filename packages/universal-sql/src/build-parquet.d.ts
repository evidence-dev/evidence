/**
 * Constructs a Buffer from provided table metadata
 * @param {{name: string, evidenceType: string}[]} columns
 * @param {any[]} data
 * @returns {Promise<Uint8Array>}
 */
export function buildParquetFromResultSet(
	columns: { name: string; evidenceType: string }[],
	data: any[]
): Promise<Uint8Array>;
