import {
	tableFromArrays,
	tableToIPC,
	vectorFromArray,
	Float64,
	Utf8,
	Bool,
	TimestampMillisecond
} from 'apache-arrow';
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

		/** @type {import("apache-arrow").Vector} */
		let values;
		switch (c.evidenceType) {
			case 'number':
				values = vectorFromArray(rawValues, new Float64());
				break;
			case 'string':
				values = vectorFromArray(rawValues, new Utf8());
				break;
			case 'date':
				// TODO: What gives with timezones
				values = vectorFromArray(rawValues, new TimestampMillisecond());
				break;
			case 'boolean':
				values = vectorFromArray(rawValues, new Bool());
				break;
			default:
				throw new Error(
					'Unrecognized EvidenceType: ' +
						c.evidenceType +
						'\n This is likely an error in a datasource connector.'
				);
		}

		return [c.name, values];
	});

	const t = tableFromArrays(Object.fromEntries(m));

	const writerProperties = new WriterPropertiesBuilder().setCompression(Compression.ZSTD).build();

	const IPC = tableToIPC(t, 'stream');

	return writeParquet(IPC, writerProperties);
}
