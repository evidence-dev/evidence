declare module '@uwdata/mosaic-sql' {
	type BuilderFunction = <T extends any[] = unknown[]>(...args: T) => Query;

	class Query {
		distinct: BuilderFunction;
		from: BuilderFunction;
		select: BuilderFunction;
		$select: BuilderFunction;
		$groupby: BuilderFunction;

		offset: BuilderFunction<[number]>;
		limit: BuilderFunction<[string]>;
		orderby: BuilderFunction;
		where: BuilderFunction;
		clone: BuilderFunction<[]>;
		with: BuilderFunction;
	}

	const desc = CallableFunction;
	const sql = CallableFunction;
	const count = CallableFunction;
	const sum = CallableFunction;
	const avg = CallableFunction;
	const min = CallableFunction;
	const max = CallableFunction;
	const median = CallableFunction;
}
