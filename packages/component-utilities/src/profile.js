export function profile(f, ...args) {
	const before = performance.now();
	const complete = () => {
		const after = performance.now();
		console.groupCollapsed(`${f.name} took ${(after - before).toFixed(0)}ms`);
		console.log(args)
		console.groupEnd()
	};
	// Attempt to retain `this` scope based on where profile is called
	const r = f.call(this, ...args);
	if (r instanceof Promise) {
		return r.then((promiseResult) => {
			complete();
			return promiseResult;
		});
	} else {
		complete();
		return r;
	}
}
