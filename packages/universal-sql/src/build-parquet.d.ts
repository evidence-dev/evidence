/**
 * Constructs a Buffer from provided table metadata
 * @param {{title: string, type: string}[]} columns
 * @param {any[]} data
 * @returns {Promise<Uint8Array>}
 */
export function buildParquetFromResultSet(columns: {
    title: string;
    type: string;
}[], data: any[]): Promise<Uint8Array>;
