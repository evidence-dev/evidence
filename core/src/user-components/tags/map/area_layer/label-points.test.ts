import { describe, expect, it } from 'vitest';
import { getLabelPoint } from './label-points';

function isInside([x, y]: [number, number], ring: GeoJSON.Position[]): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [ax, ay] = ring[i];
		const [bx, by] = ring[j];
		if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
	}
	return inside;
}

const square = (x: number, y: number, size: number): GeoJSON.Position[] => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y]
];

describe('getLabelPoint', () => {
	it('returns null for missing or non-polygon geometry', () => {
		expect(getLabelPoint(null)).toBeNull();
		expect(getLabelPoint({ type: 'Point', coordinates: [1, 2] })).toBeNull();
	});

	it('centers the label in a square', () => {
		const [x, y] = getLabelPoint({ type: 'Polygon', coordinates: [square(0, 0, 10)] })!;
		expect(x).toBeCloseTo(5, 0);
		expect(y).toBeCloseTo(5, 0);
	});

	it('labels only the largest part of a MultiPolygon', () => {
		const mainland = square(0, 0, 10);
		const island = square(20, 20, 1);
		const point = getLabelPoint({
			type: 'MultiPolygon',
			coordinates: [[island], [mainland]]
		})!;
		expect(isInside(point, mainland)).toBe(true);
		expect(isInside(point, island)).toBe(false);
	});

	it('keeps the label inside a concave shape whose centroid falls outside', () => {
		// A "C" shape: the centroid sits in the empty notch on the right
		const cShape: GeoJSON.Position[] = [
			[0, 0],
			[10, 0],
			[10, 2],
			[2, 2],
			[2, 8],
			[10, 8],
			[10, 10],
			[0, 10],
			[0, 0]
		];
		const point = getLabelPoint({ type: 'Polygon', coordinates: [cShape] })!;
		expect(isInside(point, cShape)).toBe(true);
	});

	it('avoids holes', () => {
		const outer = square(0, 0, 10);
		const hole = square(3, 3, 4);
		const point = getLabelPoint({ type: 'Polygon', coordinates: [outer, hole] })!;
		expect(isInside(point, outer)).toBe(true);
		expect(isInside(point, hole)).toBe(false);
	});
});
