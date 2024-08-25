export type PipelineDriver = {
	finalizePipeline: (parquetDirectory, parquetFile) => Promise<void>;
	runPipeline: (
		pythonString: string,
		parquetDirectory: string,
		parquetFile: string
	) => Promise<void>;
};
