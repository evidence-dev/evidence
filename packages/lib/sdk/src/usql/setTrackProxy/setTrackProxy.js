export const Unset = Symbol('Unset');
export const IsSetTracked = Symbol('IsSetTracked');
const GetModKeys = Symbol('GetModKeys');
const GetOwnKey = Symbol('GetOwnKey');
const GetOwnPath = Symbol('GetOwnPath');
const GetParent = Symbol('GetParent');

export const setTrackProxy = (
	/** @type {Record<string|number|symbol,string>} */ defaultStringMap = {},
	/** @type {any} */ root = {},
	/** @type {any|undefined} */ parent = undefined,
	/** @type {string|number|symbol|undefined} */ ownKey = undefined
) => {
	if (parent && !parent[IsSetTracked]) throw new Error(`SetTracked parent must be SetTracked`);

	const wrapped = Object.assign(() => {}, root ?? {});

	/** @type {Array<string|number|symbol>} */
	const modifiedKeys = Object.keys(wrapped);
	const self = new Proxy(wrapped, {
		get(target, prop) {
			switch (prop) {
				case Unset:
					return !parent?.[GetModKeys].includes(ownKey);
				case GetModKeys:
					return modifiedKeys;
				case GetOwnKey:
					return ownKey;
				case GetParent:
					return parent;
				case GetOwnPath: {
					const path = [ownKey];
					let tmpParent = parent;
					while (tmpParent !== undefined) {
						path.unshift(tmpParent[GetOwnKey]);
						tmpParent = tmpParent[GetParent];
					}
					return path.join('.');
				}
				case IsSetTracked:
					return true;
				case 'toJSON':
					return () => ({ ...target });
				case 'toString':
				case 'toPrimitive':
				case Symbol.toPrimitive:
					if (self[Unset]) {
						if (ownKey && ownKey in defaultStringMap) return () => defaultStringMap[ownKey];
						return () => ``;
					} else return root.toString.bind(root);
				default:
					if (!(prop in target)) {
						target[prop] = setTrackProxy(defaultStringMap, undefined, self, prop);
					}
					return target[prop];
			}
		},
		set(target, prop, value) {
			modifiedKeys.push(prop);
			if (typeof value === 'object') {
				value = setTrackProxy(defaultStringMap, value, self, prop);
			}
			target[prop] = value;
			return true;
		}
	});

	return self;
};

/**
 * @param {TemplateStringsArray} strings
 * @param  {...any} args
 * @returns {boolean}
 */
export const hasUnsetValues = (strings, ...args) => {
	const unsetValues = args.filter((arg) => arg?.[Unset]);
	if (unsetValues.length === 0) return false;
	return true;
};
