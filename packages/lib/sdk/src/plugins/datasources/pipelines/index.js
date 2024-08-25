/* eslint-disable no-undef */
import { createRequire } from 'module';
import { projectRoot } from '../../../lib/projectPaths.js';
import path from 'path';
/**
 * @returns {Promise<import("./types.js").PipelineDriver | null>}
 */
export const loadPipelineDriver = async () => {
	let delRequire = false;
	if (!('require' in globalThis)) {
		delRequire = true;
		globalThis.require = createRequire(import.meta.url);
	}
	const initPipes = await import(
		new URL(
			'file://' +
				path.join(projectRoot, 'node_modules', '@evidence-dev/pipelines', 'src', 'index.js')
		).toString()
	)
		.then((mod) => mod.init)
		.catch(() => undefined);
	if (!initPipes) return null;
	const pipelines = await initPipes();

	if (delRequire)
		// @ts-expect-error Mutating globalThis is always wacky
		delete globalThis.require;

	const mountedDirectories = new Set();
	/**
	 * @param {string} directory
	 */
	const ensureDirectoryMounted = (directory) => {
		if (mountedDirectories.has(directory)) return;
		mountedDirectories.add(directory);
		pipelines.mountNodeFS(directory, directory);
	};

	return {
		finalizePipeline: async (parquetDirectory, parquetFile) => {
			ensureDirectoryMounted(parquetDirectory);

			await pipelines.runPython(
				`
from fastparquet import ParquetFile, write as writeParquet

data = ParquetFile('${path.join(parquetDirectory, parquetFile)}').to_pandas()

writeParquet('${path.join(parquetDirectory, parquetFile)}',data,compression='GZIP')

# Update schema.json
import pandas as pd
import json

metadata = []

for column, dtype in data.dtypes.items():
	column_info = {
		"name": column,
		"typeFidelity": "precise"
	}
	
	if pd.api.types.is_integer_dtype(dtype) or pd.api.types.is_float_dtype(dtype):
		column_info["evidenceType"] = "number"
	elif pd.api.types.is_string_dtype(dtype):
		column_info["evidenceType"] = "string"
	elif pd.api.types.is_bool_dtype(dtype):
		column_info["evidenceType"] = "boolean"
	elif pd.api.types.is_datetime64_any_dtype(dtype):
		column_info["evidenceType"] = "date"
	else:
		# For any other types, default to string
		column_info["evidenceType"] = "string"
		column_info["typeFidelity"] = "inferred"
	
	metadata.append(column_info)

with open('${path.join(parquetDirectory, parquetFile.replace('.parquet', '.schema.json'))}', 'w') as f:
	json.dump(metadata, f)

			`.replaceAll('\t', '    ')
			);
		},
		runPipeline: async (pythonString, parquetDirectory, parquetFile) => {
			ensureDirectoryMounted(parquetDirectory);

			await await pipelines.runPython(
				`
from fastparquet import ParquetFile, write as writeParquet

async def run():
    # Read parquet and make it available
    parquetFile = ParquetFile('${path.join(parquetDirectory, parquetFile)}')
    data = parquetFile.to_pandas()
    ${pythonString.replaceAll('\n', '\n    ')}
    # Write parquet back
    writeParquet('${path.join(parquetDirectory, parquetFile)}', data) # TODO: Compression
run()
                `.replaceAll('\t', '    ')
			);
			return void 0;
		}
	};
};
