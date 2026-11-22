export type SparklinePoint = [x: string | Date, y: number];

/** Keeps every nth point so a sparkline draws at most `maxPoints`. */
export function sampleSparkline<T>(points: T[], maxPoints = 100): T[] {
	if (points.length <= maxPoints) return points;
	const interval = Math.ceil(points.length / maxPoints);
	return points.filter((_, index) => index % interval === 0);
}

/** Accepts a flat "x1,y1,x2,y2,…" string or [x, y] pairs; numeric x values are timestamps. */
export function parseSparklineData(value: unknown): SparklinePoint[] {
	if (typeof value === 'string') {
		const parts = value.split(',');
		const points: SparklinePoint[] = [];
		for (let i = 0; i + 1 < parts.length; i += 2) {
			const x = parts[i].trim();
			const y = Number(parts[i + 1].trim());
			if (!Number.isNaN(y)) points.push([Number.isNaN(Number(x)) ? x : new Date(Number(x)), y]);
		}
		return points;
	}
	if (Array.isArray(value)) {
		const points: SparklinePoint[] = [];
		for (const item of value) {
			if (!Array.isArray(item) || item.length < 2) continue;
			const [x, rawY] = item;
			const y = Number(rawY);
			if (Number.isNaN(y)) continue;
			points.push([typeof x === 'number' ? new Date(x) : x instanceof Date ? x : String(x), y]);
		}
		return points;
	}
	return [];
}
