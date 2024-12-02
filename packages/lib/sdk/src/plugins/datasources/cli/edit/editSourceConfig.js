import chalk from 'chalk';
import * as prompt from '@clack/prompts';

import { EvidenceError } from '../../../../lib/EvidenceError.js';
import {
	OptionGetSpec,
	OptionParentMode,
	OptionSpecMode,
	Options,
	getSpecAtPath
} from './Options.js';
import { dataDirectory, metaDirectory } from '../../../../lib/projectPaths.js';
import { evalSources } from '../../evalSources.js';
import { updateManifest } from '../../updateManifest.js';
import { writeSourceConfig } from '../../writeSourceConfig.js';

/**
 * @returns {Promise<boolean>}
 */
const validate = async () => {
	// TODO: Validate spec
	return true;
};

/**
 * @param {*} options
 * @param {string[]} optionPath
 */
const getOptionValue = (options, optionPath) => {
	if (!optionPath.length)
		throw new EvidenceError('Internal Error', [
			'Attempted to lookup option that did not have a path'
		]);
	let v = options;
	for (const p of optionPath.slice(0, -1)) {
		v = v[p];
	}
	const lastItem = optionPath.at(-1);
	if (!lastItem)
		throw new EvidenceError('Internal Error', [
			'optionPath was already validated to have length, but is now missing a final element. Wat?'
		]);
	return v[lastItem];
};

/**
 * @param {*} options
 * @param {string[]} optionPath
 * @param {string | number | boolean} value
 */
const setOptionValue = (options, optionPath, value) => {
	if (!optionPath.length)
		throw new EvidenceError('Internal Error', [
			'Attempted to lookup option that did not have a path'
		]);
	let v = options;
	for (const p of optionPath.slice(0, -1)) {
		v = v[p];
	}
	const lastItem = optionPath.at(-1);
	if (!lastItem)
		throw new EvidenceError('Internal Error', [
			'optionPath was already validated to have length, but is now missing a final element. Wat?'
		]);
	v[lastItem] = value;
};

/**
 * @param {*} options
 * @param {string[]} optionPath
 */
const editOption = async (options, optionPath) => {
	const spec = getSpecAtPath(options, optionPath);

	if (!spec)
		throw new EvidenceError('Internal Error', ['Attempted to edit option that does not exist!']);
	let v;
	const message = `${chalk.bold(spec.title)} ${chalk.dim(`(${spec.description ?? ''})`)}`;

	const initialValue = getOptionValue(options, optionPath) ?? spec.default;
	switch (spec.type) {
		case 'string':
			v = await prompt
				.text({
					initialValue: initialValue,
					message: message
				})
				.then((r) => {
					if (!prompt.isCancel(r)) return r.toString();
					return r;
				});
			break;
		case 'number':
			v = await prompt
				.text({
					initialValue: initialValue.toString(),
					message: message,
					validate: (s) => {
						if (!/^[\d]+$/.test(s)) return `${spec.title} must be a number`;
					}
				})
				.then((r) => parseInt(r.toString()));
			break;
		case 'boolean':
			v = await prompt.confirm({
				initialValue: initialValue,
				message: message
			});
			break;
		case 'select':
			if (!spec.options)
				throw new EvidenceError('Internal Error', [
					'Attempted to edit a select option that has no choices!'
				]);
			v = await prompt.select({
				initialValue: initialValue,
				message: message,
				options: spec.options?.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))
			});
			break;
		case 'file':
			break;
	}

	if (!prompt.isCancel(v)) setOptionValue(options, optionPath, v);
};

/**
 * @param {*} options
 * @param {string} [prefix]
 * @returns {{label: string, value: string[]}[]}
 */
const transformOptionsToSelectList = (options, prefix) => {
	const output = [];
	for (const [k, v] of Object.entries(options[OptionGetSpec])) {
		const keyWithPrefix = prefix ? `${prefix}.${k}` : k;
		const title = chalk.bold(keyWithPrefix);
		const description = chalk.dim(`(${v.description ?? ''})`);
		const shown = (v.secret && v.shown) || !v.secret;
		const unsetMarker = v.required ? chalk.bold.red('unset') : chalk.yellow('unset');
		const hasValue = options[k] || (v.default !== undefined && v.default !== null);

		const currentValue =
			(v.children ? options[OptionParentMode][k] : options[k]) ??
			chalk.yellow(v.default) ??
			unsetMarker;
		const shownValue = shown ? `[${currentValue}]` : `[hidden, ${hasValue ? 'set' : unsetMarker}]`;
		output.push({
			label: `${title} ${shownValue} ${description}`,
			value: keyWithPrefix.split('.')
		});

		if (v.children && typeof options[OptionSpecMode][k] === 'object') {
			output.push(...transformOptionsToSelectList(options[k], keyWithPrefix));
		}
	}
	return output;
};

/**
 * @param {import("../../schemas/datasource.schema.js").DatasourceSpec & { dir: string }} source
 * @param {import("../../Datasources.js").Datasource} plugin
 */
export const editSourceConfig = async (source, plugin) => {
	const options = Options(plugin.options, source.options);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const selectItems = transformOptionsToSelectList(options);
		const selection = await prompt.select({
			message: 'Pick an option to configure',
			options: [...selectItems, { label: 'Done', value: null }]
		});

		if (selection === null) {
			const valid = await validate();
			if (valid) break;
		} else {
			await editOption(options, selection);
		}
	}
	await writeSourceConfig(options, source, prompt.spinner());

	const runNow = await prompt.confirm({
		message: `Would you like to run the source queries for ${source.name} now?`
	});
	if (runNow) {
		const filter = {
			sources: new Set([source.name]),
			queries: new Set(),
			only_changed: false
		};
		// Create some space to reduce the wackiness
		console.log('\n\n');
		// TODO: this is duplicated with the sources cli command, should be a shared func
		const evaluatedManifest = await evalSources(dataDirectory, metaDirectory, filter);
		await updateManifest(evaluatedManifest, dataDirectory);
	}

	return;
};
