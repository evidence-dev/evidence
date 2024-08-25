import ora from 'ora';
import { loadPipelineDriver } from '../pipelines/index.js';
import fs from 'fs/promises';
import { pipelinesDirectory } from '../../../lib/projectPaths.js';
import path from 'path';

/**
 * @param {string} tableName
 * @param {import("../schemas/datasource.schema.js").DatasourceSpecPipeline} pipeline
 * @param {string} parquetPath
 */
export const execPipeline = async (tableName, pipeline, parquetPath) => {
	const spinner = ora({
		prefixText: `  ${tableName} | Pipeline: ${pipeline.name}`,
		spinner: 'triangle',
		discardStdin: false,
		interval: 250
	});
	spinner.start('Processing...');

	const driver = await loadPipelineDriver();
	if (driver === null) {
		spinner.fail('@evidence-dev/pipelines not found, do you need to install it?');
		return;
	}

	try {
		await fs.cp(
			path.join(parquetPath, tableName + '.parquet'),
			path.join(parquetPath, tableName + '.parquet.bak')
		);

		for (const pipeFile of pipeline.steps) {
			const stepCode = await fs.readFile(path.join(pipelinesDirectory, pipeFile + '.py'), 'utf8');
			await driver.runPipeline(stepCode, parquetPath, tableName + '.parquet');
		}
		await driver.finalizePipeline(parquetPath, tableName + '.parquet');

		spinner.succeed('Done');
	} catch (e) {
		console.debug(e);
		spinner.fail('Pipeline execution failed');
		await fs.cp(
			path.join(parquetPath, tableName + '.parquet.bak'),
			path.join(parquetPath, tableName + '.parquet')
		);
	} finally {
		await fs.rm(path.join(parquetPath, tableName + '.parquet.bak'));
		spinner.stop();
	}
};
