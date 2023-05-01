const { getEnv } = require('./getEnv.cjs');

describe('getEnv', () => {
	it('should be defined', () => {
		expect(getEnv).toBeDefined();
	});

	it('should find a 1st level key', () => {
		process.env['my-key'] = 'some-value';
		const map = {
			someArbitraryString: [{ key: 'my-key', deprecated: false }]
		};

		const output = getEnv(map, 'someArbitraryString');

		expect(output).toEqual('some-value');

		delete process.env['my-key'];
	});

	it('should find a 2nd level key', () => {
		process.env['my-key'] = 'some-value';
		const map = {
			'1st': {
				'2nd': [{ key: 'my-key', deprecated: false }]
			}
		};
		const output = getEnv(map, '1st', '2nd');

		expect(output).toEqual('some-value');

		delete process.env['my-key'];
	});

	it('should always return the first match', () => {
		process.env['my-key'] = 'some-value';
		process.env['my-other-key'] = 'some-other-value';
		const map = {
			someArbitraryString: [
				{ key: 'my-key', deprecated: false },
				{ key: 'my-other-key', deprecated: false }
			]
		};

		const output = getEnv(map, 'someArbitraryString');

		expect(output).toEqual('some-value');

		delete process.env['my-key'];
		delete process.env['my-other-key'];
	});

	it('should skip missing values', () => {
		process.env['my-other-key'] = 'some-other-value';
		const map = {
			someArbitraryString: [
				{ key: 'my-key', deprecated: false },
				{ key: 'my-other-key', deprecated: false }
			]
		};

		const output = getEnv(map, 'someArbitraryString');

		expect(output).toEqual('some-other-value');

		delete process.env['my-other-key'];
	});
});
