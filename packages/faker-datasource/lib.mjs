/**
 * Renames the '_errors' property to 'errors' in the given object and its nested objects recursively.
 * It also removes any empty errors arrays
 *
 * @param {any} obj - The object to rename the '_errors' property in.
 * @return {Object} The object with the renamed property.
 */
export function cleanZodErrors(obj) {
	for (const key in obj) {
		if (typeof obj[key] === 'object') {
			cleanZodErrors(obj[key]); // recursively traverse nested objects
		}
		if (key === '_errors') {
			if (obj['_errors'].length) {
				// De-duplicate
				obj['errors'] = Array.from(new Set(obj['_errors']));
			}
			delete obj['_errors'];
		}
	}
	return obj;
}

/**
 * Generate an array of random, unique points within a specified range using faker.js.
 * @param {number} n - Number of points to generate.
 * @param {number} min - Minimum value of the range (inclusive).
 * @param {number} max - Maximum value of the range (inclusive).
 * @param {import("@faker-js/faker").Faker} fakerInstance - Instance of faker.js.
 * @returns {number[]} - Array of random, unique points.
 */
export function generateRandomPointsWithFaker(n, min, max, fakerInstance) {
	// Validate input parameters
	if (n <= 0 || !Number.isInteger(n) || min >= max) {
		throw new Error('Invalid input parameters');
	}

	// Ensure the range has enough values to generate unique points
	if (max - min + 1 < n) {
		throw new Error('Not enough values in the range to generate unique points');
	}

	/** @type {number[]} */
	const result = [];

	// Generate n random, unique points using faker.js
	for (let i = 0; i < n; i++) {
		let randomPoint;

		// Keep generating random points until a unique one is found
		do {
			// Use faker.js to generate a random point
			randomPoint = fakerInstance.number.int({ min, max });
		} while (result.includes(randomPoint));

		// Add the unique point to the result array
		result.push(randomPoint);
	}

	return result.sort((a, b) => a - b);
}
