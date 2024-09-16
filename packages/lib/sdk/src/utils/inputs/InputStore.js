import { storeMixin } from '../../lib/store-helpers/storeMixin.js';
import { Input } from './Input.js';

/**
 *
 * @param {InputStore} is
 * @returns
 */
const inputStoreProxy = (is) => {
	new Proxy(is, {
		get(target, prop) {
			if (!(prop.toString() in target)) {
				target[prop.toString()] = new Input(prop.toString());
			}
			return target[prop.toString()];
		}
	});
};


export class InputStore {
	#storeMixin = storeMixin();
}
