import path from 'path';
import yaml from 'yaml';
import fs from 'fs/promises';

import { loadSourcePlugins } from '../loadSourcePlugins.js';
import { loadSources } from '../loadSources.js';
import * as prompt from '@clack/prompts';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { editSourceConfig } from './edit/editSourceConfig.js';

export const editConnectionsPrompt = async () => {
	const dataSpinner = prompt.spinner();

	dataSpinner.start('Fetching connections and plugins');
	const [sources, plugins] = await Promise.all([loadSources(), loadSourcePlugins()]);
	dataSpinner.stop('Done!', 0);

	const selectedSourceName = await prompt.select({
		message: 'Which source are we editing?',
		options: [
			...sources.map((source) => ({
				value: source.name,
				label: `${source.name} (${source.type})`
			})),
			{
				value: null,
				label: 'Create new connection'
			}
		]
	});

	if (selectedSourceName) {
		const selectedSource = sources.find((source) => source.name === selectedSourceName);
		if (!selectedSource) throw new EvidenceError('');
		const plugin = plugins.getBySource(selectedSource.type);
		if (!plugin)
			throw new EvidenceError('Tried to edit source that does not have a correlated plugin');
		await editSourceConfig(selectedSource, plugin[1]);
	} else {
		const canonSources = plugins.getCanonicalSources();

		if (!canonSources.length) {
			prompt.log.error(
				'No source plugins are installed, or none were found in evidence.config.yaml'
			);
			prompt.cancel('Operation Failed');

			return false;
		}

		const selectedType = await prompt.select({
			message: 'What source should we connect to?',
			options: canonSources.map((s) => ({ value: s }))
		});

		if (prompt.isCancel(selectedType)) {
			prompt.cancel('Did not create connection!');
			return false;
		}

		/** @type {string | symbol} */
		const name = await prompt
			.text({
				message: 'What should we call this connection?',
				validate: (s) => {
					if (s.length === 0) return 'Connection name must not be empty';
					if (!/^[\w_]+$/.test(s))
						return 'Connection name can only contain letters, numbers, and underscores';
				}
			})
			.then((r) => (prompt.isCancel(r) ? r : r?.toString()));

		if (prompt.isCancel(name)) {
			prompt.cancel('Did not create connection!');
			return false;
		}

		const existingSourceDirs = await fs.readdir(path.resolve('sources'));
		if (existingSourceDirs.includes(name))
			throw new EvidenceError(
				`Cannot create source ${name}, directory ./sources/${name} already exists`
			);
		const sourceWithSameName = sources.find((source) => source.name === name);
		if (sourceWithSameName)
			throw new EvidenceError(
				`Cannot create source ${name}, a source with that name already exists in ${sourceWithSameName.dir}`
			);
		await fs.mkdir(path.join(path.resolve('sources'), name));
		const comment = `# This file was automatically generated\n`;
		await fs.writeFile(
			path.join(path.resolve('sources'), name, 'connection.yaml'),
			comment + yaml.stringify({ name, type: selectedType })
		);

		const newSource = (await loadSources()).find((s) => s.name === name);
		if (!newSource)
			throw new EvidenceError('Internal Error', ['Failed to load just-created source']);
		await editSourceConfig(newSource, plugins.getBySource(newSource.type)[1]);
	}
};
