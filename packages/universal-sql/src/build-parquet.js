import { tableFromArrays, tableToIPC, vectorFromArray, Float64, Utf8, Timestamp, Bool, Null } from 'apache-arrow';
import { Compression, writeParquet, WriterPropertiesBuilder } from 'parquet-wasm/node/arrow1.js';

/**
 * Constructs a Buffer from provided table metadata
 * @param {{title: string, type: string}[]} columns
 * @param {any[]} data
 * @returns {Promise<Uint8Array>}
 */
export async function buildParquetFromResultSet(columns, data) {
	const m = columns.map((c) => {
		const rawValues = data.map((d) => d[c.title] ?? `Null`);

        // TODO: Make this work properly.

		/** @type {import("apache-arrow").Vector} */
		let values
		if (c.type === 'number') {
			values = vectorFromArray(rawValues, new Float64);
		} else if (c.type === 'string') {
			values = vectorFromArray(rawValues, new Utf8);
		} else if (c.type === 'date') {
			values = vectorFromArray(rawValues, new Timestamp);
		} else if (c.type === 'boolean') {
			values = vectorFromArray(rawValues, new Bool);
		} else {
			throw new Error("Unrecognized EvidenceType: " + c.type + "\n This is likely an error in a datasource connector.");
		}
		
		console.log(values.length, values.toArray())
		return [c.title, values];
	});

	const t = tableFromArrays(Object.fromEntries(m));

	const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();
    
    const IPC = tableToIPC(t, 'stream');

	const parquetBuffer = writeParquet(IPC, writerProperties);

	return parquetBuffer;
}
