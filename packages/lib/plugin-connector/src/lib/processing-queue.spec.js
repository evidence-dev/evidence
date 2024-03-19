import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessingQueue } from './processing-queue';

describe('ProcessingQueue', () => {
	const testFn = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('Should be defined', () => {
		expect(ProcessingQueue).toBeDefined();
	});
	it('Should execute a syncronous function', () => {
		const q = ProcessingQueue();

		q.add(testFn);

		expect(testFn).toHaveBeenCalledOnce();
	});

	it('Should execute an async function', () => {
		const q = ProcessingQueue();
		testFn.mockImplementation(async () => {});
		q.add(testFn);

		expect(testFn).toHaveBeenCalledOnce();
	});

	it('Should emit a `done` event when all functions have been processed', () => {
		const q = ProcessingQueue();
		const eventListener = vi.fn();
		q.addListener('done', eventListener);
		q.add(testFn);
		expect(testFn).toHaveBeenCalledOnce();
		expect(eventListener).toHaveBeenCalledOnce();
	});

	it('Should execute multiple sync functions', async () => {
		const q = ProcessingQueue();

		q.add(testFn, testFn);

		expect(testFn).toHaveBeenCalledTimes(2);
	});

	it('Should execute multiple async functions', async () => {
		const q = ProcessingQueue();
		testFn.mockImplementation(async () => {});
		q.add(testFn, testFn);
		// Wait for async
		await q.finish();

		expect(testFn).toHaveBeenCalledTimes(2);
	});

	it('Should execute multiple syncronous functions when queued separately', async () => {
		const q = ProcessingQueue();

		testFn.toString = () => 'MockedFn';
		q.add(testFn, testFn);
		q.add(testFn, testFn);
		q.add(testFn, testFn);
		await q.finish();

		expect(testFn).toHaveBeenCalledTimes(6);
	});

	it('Should execute multiple async functions when queued separately', async () => {
		const q = ProcessingQueue();
		testFn.mockImplementation(async () => {});
		q.add(testFn, testFn);
		q.add(testFn, testFn);
		q.add(testFn, testFn);
		// Wait for async
		await q.finish();

		expect(testFn).toHaveBeenCalledTimes(6);
	});

	it('Should execute a mix of sync & async functions', async () => {
		const q = ProcessingQueue();
		const asyncTest = vi.fn().mockImplementation(async () => {});
		q.add(testFn, asyncTest);
		// Wait for async
		await q.finish();

		expect(testFn).toHaveBeenCalledTimes(1);
		expect(asyncTest).toHaveBeenCalledTimes(1);
	});

	it('Should execute a mix of sync & async functions when queued separately', async () => {
		const q = ProcessingQueue();
		const asyncTest = vi.fn().mockImplementation(async () => {});
		q.add(testFn, asyncTest);
		q.add(testFn, asyncTest);
		q.add(testFn, asyncTest);
		// Wait for async
		await q.finish();

		expect(testFn).toHaveBeenCalledTimes(3);
		expect(asyncTest).toHaveBeenCalledTimes(3);
	});

	it('Should handle a syncronous function that throws an error', async () => {
		const q = ProcessingQueue();
		const innerError = new Error('Hello!');
		testFn.mockImplementation(() => {
			throw innerError;
		});
		const eventListener = vi.fn();
		q.addListener('err', eventListener);

		q.add(testFn);
		expect(testFn).toHaveBeenCalledOnce();
		expect(eventListener).toHaveBeenCalledWith(innerError);
	});

	it('Should handle an asyncronous function that throws an error', async () => {
		const q = ProcessingQueue();
		const innerError = new Error('Hello!');
		testFn.mockImplementation(async () => {
			throw innerError;
		});
		const eventListener = vi.fn();
		q.addListener('err', eventListener);

		// Waiting for this _will_ wait for the queue to empty
		await q.add(testFn);
		expect(testFn).toHaveBeenCalledOnce();
		expect(eventListener).toHaveBeenCalledWith(innerError);
	});

	it('Should stop execution when it encounters an error and stopOnError is true', async () => {
		const q = ProcessingQueue({ stopOnError: true });
		const innerError = new Error('Hello!');
		testFn.mockImplementationOnce(async () => {
			throw innerError;
		});

		q.add(testFn);
		testFn.mockImplementationOnce(async () => {});
		// This should not actually get called, stopOnError, and the error above, means that the queue will freeze.
		await q.add(testFn);

		expect(testFn).toHaveBeenCalledOnce();
	});
});
