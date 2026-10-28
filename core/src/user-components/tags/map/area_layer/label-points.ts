/*
 * The pole-of-inaccessibility search in this file (cells, distance and centroid helpers) is
 * adapted from mapbox/polylabel (https://github.com/mapbox/polylabel), used under the ISC License:
 *
 * Copyright (c) 2026 Mapbox
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO
 * THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
 * IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
 * CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA
 * OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
 * ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS
 * SOFTWARE.
 */

type Ring = GeoJSON.Position[];
type PolygonRings = Ring[];

/**
 * One label anchor per area: the visual center of the feature's largest polygon.
 *
 * Letting the GL symbol layer place labels on the polygon source labels every part of a
 * MultiPolygon (Hawaii, Michigan, coastal islands), so values repeat. A plain centroid
 * can fall outside concave shapes (Florida, Louisiana), so we use the pole of
 * inaccessibility — the interior point farthest from any edge.
 */
export function getLabelPoint(geometry: GeoJSON.Geometry | null): [number, number] | null {
	if (!geometry) return null;

	let polygon: PolygonRings | undefined;
	if (geometry.type === 'Polygon') {
		polygon = geometry.coordinates;
	} else if (geometry.type === 'MultiPolygon') {
		let largestArea = -Infinity;
		for (const candidate of geometry.coordinates) {
			const area = Math.abs(ringArea(candidate[0] ?? []));
			if (area > largestArea) {
				largestArea = area;
				polygon = candidate;
			}
		}
	}

	if (!polygon?.[0]?.length) return null;
	return poleOfInaccessibility(polygon);
}

function ringArea(ring: Ring): number {
	let sum = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
	}
	return sum / 2;
}

type Cell = {
	x: number;
	y: number;
	half: number;
	// Signed distance from the cell center to the polygon outline (negative = outside)
	distance: number;
	// Upper bound on the distance achievable anywhere inside the cell
	max: number;
};

function makeCell(x: number, y: number, half: number, polygon: PolygonRings): Cell {
	const distance = pointToPolygonDistance(x, y, polygon);
	return { x, y, half, distance, max: distance + half * Math.SQRT2 };
}

// Grid search with a best-first queue, adapted from mapbox/polylabel (license at top of file)
function poleOfInaccessibility(polygon: PolygonRings): [number, number] {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of polygon[0]) {
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x > maxX) maxX = x;
		if (y > maxY) maxY = y;
	}

	const width = maxX - minX;
	const height = maxY - minY;
	const cellSize = Math.min(width, height);
	if (cellSize === 0) return [minX, minY];

	// Relative precision keeps the work bounded for both states and small counties
	const precision = Math.max(cellSize / 200, 1e-9);

	const queue: Cell[] = [];
	const half = cellSize / 2;
	for (let x = minX; x < maxX; x += cellSize) {
		for (let y = minY; y < maxY; y += cellSize) {
			queue.push(makeCell(x + half, y + half, half, polygon));
		}
	}

	// Seed with the centroid and bbox center; for compact shapes one of these is already close
	let best = makeCentroidCell(polygon);
	const bboxCell = makeCell(minX + width / 2, minY + height / 2, 0, polygon);
	if (bboxCell.distance > best.distance) best = bboxCell;

	while (queue.length) {
		// Pop the cell with the highest potential; the queue stays small enough that a linear
		// scan is cheaper than maintaining a heap
		let index = 0;
		for (let i = 1; i < queue.length; i++) {
			if (queue[i].max > queue[index].max) index = i;
		}
		const cell = queue[index];
		queue[index] = queue[queue.length - 1];
		queue.pop();

		if (cell.distance > best.distance) best = cell;
		if (cell.max - best.distance <= precision) continue;

		const h = cell.half / 2;
		queue.push(makeCell(cell.x - h, cell.y - h, h, polygon));
		queue.push(makeCell(cell.x + h, cell.y - h, h, polygon));
		queue.push(makeCell(cell.x - h, cell.y + h, h, polygon));
		queue.push(makeCell(cell.x + h, cell.y + h, h, polygon));
	}

	return [best.x, best.y];
}

function makeCentroidCell(polygon: PolygonRings): Cell {
	const ring = polygon[0];
	let area = 0;
	let x = 0;
	let y = 0;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [ax, ay] = ring[i];
		const [bx, by] = ring[j];
		const f = ax * by - bx * ay;
		x += (ax + bx) * f;
		y += (ay + by) * f;
		area += f * 3;
	}
	if (area === 0) return makeCell(ring[0][0], ring[0][1], 0, polygon);
	return makeCell(x / area, y / area, 0, polygon);
}

function pointToPolygonDistance(x: number, y: number, polygon: PolygonRings): number {
	let inside = false;
	let minDistSq = Infinity;

	for (const ring of polygon) {
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const a = ring[i];
			const b = ring[j];
			if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
				inside = !inside;
			}
			minDistSq = Math.min(minDistSq, segmentDistanceSq(x, y, a, b));
		}
	}

	return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

function segmentDistanceSq(px: number, py: number, a: GeoJSON.Position, b: GeoJSON.Position) {
	let x = a[0];
	let y = a[1];
	let dx = b[0] - x;
	let dy = b[1] - y;

	if (dx !== 0 || dy !== 0) {
		const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
		if (t > 1) {
			x = b[0];
			y = b[1];
		} else if (t > 0) {
			x += dx * t;
			y += dy * t;
		}
	}

	dx = px - x;
	dy = py - y;
	return dx * dx + dy * dy;
}
