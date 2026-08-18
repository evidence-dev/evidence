import { distance } from 'fastest-levenshtein';

const getSimilarity = (a: string, b: string): number => {
	const maxLength = Math.max(a.length, b.length);
	const dist = distance(a, b);
	const similarity = (maxLength - dist) / maxLength;
	return similarity;
};

export const findClosestMatch = (
	input: string,
	options: string[],
	threshold: number = 0.6
): string | undefined => {
	let closestMatch: string | undefined;
	let highestSimilarity: number = 0;

	for (const option of options) {
		const similarity = getSimilarity(input, option);
		if (similarity >= threshold && similarity > highestSimilarity) {
			closestMatch = option;
			highestSimilarity = similarity;
		}
	}

	return closestMatch;
};
