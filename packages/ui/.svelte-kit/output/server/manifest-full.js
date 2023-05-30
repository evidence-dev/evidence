export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":{"file":"_app/immutable/entry/start.4fa94c69.js","imports":["_app/immutable/entry/start.4fa94c69.js","_app/immutable/chunks/index.e8978f25.js","_app/immutable/chunks/singletons.eae0dae9.js"],"stylesheets":[],"fonts":[]},"app":{"file":"_app/immutable/entry/app.642408fd.js","imports":["_app/immutable/entry/app.642408fd.js","_app/immutable/chunks/index.e8978f25.js"],"stylesheets":[],"fonts":[]}},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
