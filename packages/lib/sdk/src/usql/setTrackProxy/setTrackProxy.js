// TODO: Type this better
export const Unset = Symbol('Unset');
export const IsSetTracked = Symbol('IsSetTracked');
const GetModKeys = Symbol('GetModKeys');

export const setTrackProxy = (
	/** @type {Record<string|number|symbol,string>} */ defaultStringMap = {},
	/** @type {any} */ root = {},
	/** @type {any|undefined} */ parent = undefined,
	/** @type {string|number|symbol|undefined} */ ownKey = undefined
) => {
	if (parent && !parent[IsSetTracked]) throw new Error(`SetTracked parent must be SetTracked`);

	/** @type {Array<string|number|symbol>} */
	const modifiedKeys = Object.keys(root ?? {});
	const self = new Proxy(root ?? {}, {
		get(target, prop) {
			// console.log(target, prop, root, ownKey, JSON.stringify(target[prop]))
			switch (prop) {
				case Unset:
					return !parent?.[GetModKeys].includes(ownKey);
				case GetModKeys:
					return modifiedKeys;
				case IsSetTracked:
					return true;
				case 'toJSON':
					return () => JSON.stringify(target[prop]);
				case 'toString':
				case 'toPrimative':
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
	return args.some((arg) => arg?.[Unset]);
};
