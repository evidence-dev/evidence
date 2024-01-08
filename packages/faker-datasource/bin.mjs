#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { generateDemoSources } from './source-generator.mjs';

async function main() {
	if (process.argv[2] === 'build-series-source') {
		console.log(process.cwd());
		const currentDir = await fs.readdir(process.cwd());
		const sourcesDirPath = path.join(process.cwd(), 'sources');
		if (!currentDir.includes('sources')) await fs.mkdir(sourcesDirPath);
		const sourcesDir = await fs.readdir(sourcesDirPath);
		const sourceName = 'faker-demo-source';
		const sourcePath = path.join(sourcesDirPath, sourceName);

		if (sourcesDir.includes(sourceName)) await fs.rm(sourcePath, { force: true, recursive: true });
		await fs.mkdir(sourcePath);

		generateDemoSources(sourcePath, path.join(process.cwd(), 'src', 'lib'));
	}
}

main().catch(console.error);
