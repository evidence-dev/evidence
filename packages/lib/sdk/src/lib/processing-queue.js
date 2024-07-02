import EventEmitter from 'events';

/** @typedef {"done" | "err"} ProcessingQueueEvent */

/**
 * @typedef {Object} ProcessingQueueOpts
 * @property {boolean} [stopOnError]
 */

/**
 * @param {ProcessingQueueOpts} param0
 */
export const ProcessingQueue = ({ stopOnError } = {}) => {
	/** @type {(() => unknown)[]} */
	const queue = [];
	/** @type {boolean} */
	let running = false;

	/** @type {boolean} */
	let frozen = false;

	const emitter = new EventEmitter();
	if (stopOnError) emitter.addListener('err', () => (frozen = true));

	/**
	 * @returns {Promise<void>}
	 */
	const next = async () => {
		if (frozen) {
			running = false;
			return;
		}
		running = true;
		if (queue.length) {
			try {
				const fn = queue.pop();
				if (fn === undefined) {
					console.error('Something has gone awry!'); // TODO: This error message sucks
					return;
				}

				const result = fn();
				if (result instanceof Promise) await result;
			} catch (e) {
				emitter.emit('err', e);
			}

			await next();
		} else {
			emitter.emit('done');
			running = false;
		}
	};

	return {
		/**
		 *  @param {Array<() => unknown>}  fn
		 *  @returns {Promise<void>} Promise resolves when the queue has emptied; will throw if an error is encountered
		 */
		add(...fn) {
			queue.push(...fn);
			if (!running) {
				return next();
			}
			return Promise.resolve();
		},
		get frozen() {
			return frozen;
		},
		/**
		 * @param {ProcessingQueueEvent} event
		 * @param {Parameters<EventEmitter["addListener"]>[1]} handler
		 */
		addListener: (event, handler) => {
			emitter.addListener(event, handler);
		},
		/**
		 * @param {ProcessingQueueEvent} event
		 * @param {Parameters<EventEmitter["removeListener"]>[1]} handler
		 */
		removeListener: (event, handler) => {
			emitter.removeListener(event, handler);
		},
		removeAllListeners: emitter.removeAllListeners.bind(emitter),
		finish: async () => {
			return /** @type {Promise<void>} */ (
				new Promise((res, rej) => {
					if (running) {
						emitter.addListener('done', res);
						emitter.addListener('err', rej);
					} else res();
				})
			);
		}
	};
};
