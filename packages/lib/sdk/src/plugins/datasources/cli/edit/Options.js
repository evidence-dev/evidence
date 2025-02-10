import { EvidenceError } from '../../../../lib/EvidenceError.js';

// Symbols are used here to avoid conflicting with a potential connector option name
export const OptionDebug = Symbol();
export const OptionSpecMode = Symbol();
export const OptionSecretMode = Symbol();
export const OptionSafeMode = Symbol();
export const OptionParentMode = Symbol();
export const OptionGetSpec = Symbol();
export const IsOptions = Symbol();

/**
 * @param {import('../../schemas/datasourcePluginOptions.schema.js').IDatasourceOptionSpec} fieldSpec
 * @param {string} prop
 * @param {*} sourceOptions
 * @param {OptionsOpts} [opts]
 * @returns
 */
const resolveChildOptions = (fieldSpec, prop, sourceOptions, opts) => {
	if (!fieldSpec.children)
		throw new EvidenceError('Internal Error', [
			'Attempted to access nested value in field with no children'
		]);
	const valueKey = fieldSpec.nest ? `_${prop}` : prop;
	const currentValue = sourceOptions[valueKey];

	if (currentValue && !(currentValue in fieldSpec.children)) {
		throw new EvidenceError('Internal Error', [
			'Attempted to access value not found in Options specification',
			'Error occured while trying to access a child value',
			JSON.stringify({ currentValue, fieldSpec })
		]);
	}

	if (!sourceOptions[prop]) sourceOptions[prop] = {};

	// Assign the empty object
	return Options(
		fieldSpec.children[currentValue] ?? {},
		fieldSpec.nest ? sourceOptions[prop] : sourceOptions,
		{ ...opts, value: currentValue }
	);
};

/**
 * @typedef {Object} OptionsOpts
 * @property {boolean} [specMode = false] Changes the Options object to return booleans for all fields, indicating if they are secret or not
 * @property {boolean} [secretsMode = false] Returns values only for secrets, non-secrets will all be undefined
 * @property {boolean} [optionsMode = false] Returns values only for non-secrets, secrets will all be undefined
 * @property {boolean} [parentMode = false] Does not return nested options, instead always resolves to a value
 * @property {string} [value] Returns values only for non-secrets, secrets will all be undefined
 * @property {ReturnType<typeof Options>} [parent] Parent options proxy
 */

/**
 * @typedef {*} OptionsObj
 */

/**
 * @param {import('../../Datasources.js').Datasource["options"]} spec
 * @param {*} sourceOptions
 * @param {OptionsOpts} [opts]
 * @returns {OptionsObj}
 */
export const Options = (spec, sourceOptions, opts) => {
	return new Proxy(sourceOptions, {
		/** @returns {(string|symbol)[]} */
		ownKeys() {
			const output = [];
			for (const [specKey, specEntry] of Object.entries(spec)) {
				if (specEntry.virtual) continue;
				const valueKey = specEntry.children && specEntry.nest ? `_${specKey}` : specKey;
				if (
					!opts?.specMode /* Value Mode */ &&
					!(valueKey in sourceOptions) /* Value is not defined */
				)
					continue;
				output.push(specKey);
			}

			return output.sort((a, b) => a.localeCompare(b));
		},
		get(self, p) {
			// Mode Toggles
			if (p === IsOptions) return true;
			if (p === OptionSpecMode)
				return Options(spec, sourceOptions, { ...opts, specMode: !opts?.specMode });
			if (p === OptionSecretMode)
				return Options(spec, sourceOptions, {
					...opts,
					secretsMode: !opts?.secretsMode,
					optionsMode: false
				});
			if (p === OptionSafeMode)
				return Options(spec, sourceOptions, {
					...opts,
					optionsMode: !opts?.optionsMode,
					secretsMode: false
				});
			if (p === OptionParentMode)
				return Options(spec, sourceOptions, { ...opts, parentMode: !opts?.parentMode });
			if (p === OptionGetSpec) return spec;
			// Special Cases
			if (p === OptionDebug) return { spec, sourceOptions, opts };
			if (p === 'toJSON') return () => sourceOptions;
			if (p === 'toString' || p === Symbol.toStringTag) {
				return () => opts?.value;
			}

			const prop = p.toString();

			const fieldSpec = spec[prop];

			if (!fieldSpec) {
				throw new EvidenceError('Internal Error', [
					'Attempted to get property that is not in spec',
					JSON.stringify({ prop }),
					JSON.stringify({ spec })
				]);
			}

			const { specMode, parentMode, secretsMode, optionsMode } = opts ?? {};
			const hasChildren = Boolean(fieldSpec.children);
			const secret = Boolean(fieldSpec.secret);
			const allMode = Boolean(!secretsMode && !optionsMode);
			const validSecret = Boolean(secret && secretsMode);
			const validOption = Boolean(!secret && optionsMode);

			let returnValue;
			let returnSpec;

			if (hasChildren) {
				const valueKey = fieldSpec.nest ? `_${prop}` : prop;

				if (parentMode) {
					// Never resolveChildOptions
					if (allMode || validSecret || validOption) returnValue = self[valueKey];
					returnSpec = fieldSpec;
				} else {
					// We are in child mode, we resolveChildOptions if needed
					returnValue = resolveChildOptions(fieldSpec, prop, sourceOptions, {
						...opts,
						parent: self
					});
					returnSpec = fieldSpec?.children?.[self[valueKey]];
				}
			} else {
				returnSpec = fieldSpec;

				if (allMode || validSecret || validOption) returnValue = self[prop];
				else returnValue = undefined;
			}

			if (specMode) return returnSpec;
			else return returnValue;
		},
		set(self, p, setVal) {
			if (opts?.specMode) return false;
			const prop = p.toString();

			const fieldSpec = spec[prop];
			let target = prop;
			if (fieldSpec.children) {
				if (fieldSpec.nest) {
					if (typeof setVal !== 'object') target = `_${prop}`;
				}
			}
			if (typeof setVal === 'object') {
				const child = resolveChildOptions(spec[prop], prop, self, { ...opts, parent: self });
				for (const [k, v] of Object.entries(setVal)) {
					// This checks against spec using .get
					child[k];

					child[k] = v;
				}
			}

			self[target] = setVal;
			return true;
		}
	});
};

/**
 * @param {ReturnType<typeof Options>} options
 * @param {OptionSafeMode | OptionSecretMode} mode
 */
const filterByMode = (options, mode) => {
	const filterMode = options[mode];
	const parentMode = options[OptionParentMode];
	const rootSpec = options[OptionGetSpec];
	/** @type {*} */
	const output = {};
	for (const [key, value] of Object.entries(filterMode)) {
		if (typeof value === 'undefined') continue;
		const parentSpec = rootSpec[key];

		if (typeof value !== 'object') {
			output[key] = value;
		} else {
			if (!parentSpec.nest) {
				Object.assign(output, filterByMode(options[key], mode));

				if (typeof parentMode[mode][key] !== 'undefined') output[key] = parentMode[mode][key];
			} else {
				output[key] = {
					...filterByMode(options[key], mode)
				};
				if (`_${key}` in options) {
					output[`_${key}`] = parentMode[mode][key];
				}
			}
		}
	}

	return output;
};
/**
 * @param {ReturnType<typeof Options>} options
 */
export const getSafeOptions = (options) => filterByMode(options, OptionSafeMode);

/**
 * @param {ReturnType<typeof Options>} options
 */
export const getSecretOptions = (options) => filterByMode(options, OptionSecretMode);

/**
 * @param {*} options
 * @param {string[]} optionPath
 * @returns {import('../../schemas/datasourcePluginOptions.schema.js').IDatasourceOptionSpec}
 */
export const getSpecAtPath = (options, optionPath) => {
	let x = options[OptionSpecMode];
	const finalKey = optionPath.at(-1);
	if (!finalKey)
		throw new EvidenceError('Internal Error', [
			'optionPath ends with an invalid key',
			JSON.stringify(optionPath)
		]);

	for (const k of optionPath.slice(0, -1)) {
		x = x[k];
	}

	const out = x[OptionGetSpec]
		? x[OptionGetSpec][
				finalKey
			] /* Option is a parent, so we need to look at the parent's spec @ this value */
		: x[finalKey]; /* Option is not a parent, so we can look at it's spec directly */

	return out;
};
