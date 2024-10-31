import { storeMixin } from '../../lib/store-helpers/storeMixin.js';
import { ActiveDagNode, BlockingDagNode } from '../dag/DagNode.js';
import { AccessTrack } from '../proxies/access-track/AccessTrack.js';
import {
	InternalState,
	MakeDeeplyAccessible
} from '../proxies/recursive-proxy/RecursiveProxyPrimitive.js';
import { Input } from './Input.js';

/** @typedef {import("../dag/types.js").WithDag} WithDag */
/** @typedef {import("../dag/types.js").DagManager} DagManager */
/** @typedef {import("../dag/DagNode.js").DagNode} DagNode */

/**
 * @implements {DagManager}
 */
export class InputStore {
	listen = () => {
		throw new Error('Should be picked up by proxy');
	};
	unlisten = () => {
		throw new Error('Should be picked up by proxy');
	};
	gather = () => {
		throw new Error('Should be picked up by proxy');
	};

	#storeMixin = storeMixin();
	subscribe = this.#storeMixin.subscribe.bind(this.#storeMixin);
	update = this.#storeMixin.update.bind(this.#storeMixin);

	/** @type {import("../dag/DagNode.js").ActiveDagNode} */
	__dag;

	/**
	 * @returns {InputStore & import("../proxies/access-track/AccessTrack.js").AccessTracked & Record<string, any>}
	 */
	static create = () => {
		return /** @type {InputStore & import("../proxies/access-track/AccessTrack.js").AccessTracked} */ (
			new InputStore()
		);
	};

	/** @type {Map<string, DagNode>} */
	dagMap = new Map();

	/**
	 * @param {string[]} result
	 * @returns {Record<string, DagNode | null>}
	 */
	resultToDagNode = (result) => {
		return result.reduce((/** @type {Record<string, DagNode | null>} */ a, v) => {
			a[v] = this.dagMap.get(v) ?? null;
			return a;
		}, {});
	};

	/** @type {InputStore & import("../proxies/access-track/AccessTrack.js").AccessTracked & Record<string, any>} */
	#proxy;

	/**
	 * @protected
	 */
	constructor() {
		const rootDagNode = new ActiveDagNode(
			'InputStore',
			(_, defer) => {
				defer(() => {
					this.#storeMixin.publish(this.#proxy);
				});

				return true;
			},
			this
		);

		this.__dag = rootDagNode;

		this.#proxy = AccessTrack(
			MakeDeeplyAccessible(this, (prop) => {
				const existingDagNode = this.dagMap.get(prop.toString());

				const out = new Input(prop.toString(), {
					root: this,
					existingDagNode: existingDagNode instanceof BlockingDagNode ? existingDagNode : undefined
				});
				this.dagMap.set(prop.toString(), out.__dag);
				return out;
			})
		);
		this.#storeMixin.publish(this.#proxy);
		return this.#proxy;
	}

	['🦆'] = '__EvidenceInputStore__';

	/**
	 * @param {unknown} v
	 * @returns {v is InputStore}
	 */
	static isInputStore(v) {
		if (!v || typeof v !== 'object') return false;
		return '🦆' in v && v['🦆'] === '__EvidenceInputStore__';
	}

	toJSON = () => {
		// @ts-expect-error Not sure how to type this one
		const internalState = this.#proxy[InternalState];
		return Object.fromEntries(
			Object.entries(internalState).filter(([, v]) => Input.isInput(v)) ?? []
		);
	};
}
