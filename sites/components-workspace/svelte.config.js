import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ".md"],
	kit: {
		adapter: adapter(),
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		}
		// ,
		// package: {
		// 	dir: '../../packages/components',
		// 	emitTypes: true,
		// 	exports: {
		// 		include: ['**'],
		// 		exclude: ['_*', '**/_*']
		// 	},
		// 	files: {
		// 		include: ['**'],
		// 		exclude: []
		// 	}
		// }
		
	}
};

export default config;
