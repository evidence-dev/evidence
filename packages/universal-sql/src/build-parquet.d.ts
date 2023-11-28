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

export function buildMultipartParquet<T extends Record<string, any>>(
	columns: { name: string; evidenceType: string }[],
	data: Generator<T[]> | Promise<Generator<T[]>> | T[] | Promise<T[]>,
	tmpDir: string,
	outDir: string,
	outputFilename: string,
	expectedRowCount?: number,
	batchSize?: number
): Promise<string | false>;
