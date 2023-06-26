import { tableFromArrays, tableToIPC, vectorFromArray, Float64, Utf8, Timestamp, Bool } from 'apache-arrow';
import { Compression, writeParquet, WriterPropertiesBuilder } from 'parquet-wasm/node/arrow1.js';

/**
 * Constructs a Buffer from provided table metadata
 * @param {{name: string, evidenceType: string}[]} columns
 * @param {any[]} data
 * @returns {Promise<Uint8Array>}
 */
export async function buildParquetFromResultSet(columns, data) {
	const m = columns.map((c) => {
		const rawValues = data.map((d) => d[c.name] ?? `Null`);

        // TODO: Make this work properly.

		/** @type {import("apache-arrow").Vector} */
		let values
		if (c.evidenceType === 'number') {
			values = vectorFromArray(rawValues, new Float64);
		} else if (c.evidenceType === 'string') {
			values = vectorFromArray(rawValues, new Utf8);
		} else if (c.evidenceType === 'date') {
			values = vectorFromArray(rawValues, new Timestamp);
		} else if (c.evidenceType === 'boolean') {
			values = vectorFromArray(rawValues, new Bool);
		} else {
			throw new Error("Unrecognized EvidenceType: " + c.evidenceType + "\n This is likely an error in a datasource connector.");
		}
		
		return [c.name, values];
	});

	const t = tableFromArrays(Object.fromEntries(m));

	const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();
    
    const IPC = tableToIPC(t, 'stream');

	const parquetBuffer = writeParquet(IPC, writerProperties);

	return parquetBuffer;
}
