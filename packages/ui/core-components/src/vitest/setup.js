import { expect } from 'vitest';
import omit from 'lodash/omit.js';

expect.extend({
	toEqualIgnoringResolved(received, expected) {
		return {
			pass: this.equals(omit(received, 'resolved'), omit(expected, 'resolved')),
			message: () => 'Expected objects to be equal ignoring the `resolved` property'
		};
	}
});
