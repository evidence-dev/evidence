import fs from 'fs';
import path from 'path';

/**
 * @param {string} filename
 * @returns {boolean}
 */
const hasPrerenderExport = (filename) => {
	const content = fs.readFileSync(filename, 'utf-8');
	return content.includes('export const prerender');
};

/**
 * @type {() => void}
 */
export const markRootLayoutPrerenderable = () => {
	const src = fs.readdirSync('src');

	if (src.includes('routes')) {
		// SvelteKit app
		const routes = fs.readdirSync(path.join('src', 'routes'));
		let layoutPath;
		// in order of preference
		const layoutPaths = ['+layout.js', '+layout.server.js', '+layout.ts', '+layout.server.ts'];
		for (const layout of layoutPaths) {
			if (routes.includes(layout)) {
				// Check for a prerender output
				if (hasPrerenderExport(path.join('src', 'routes', layout))) {
					// The user has already added a prerender export; we shouldn't override it.
					return;
				} else {
					layoutPath = layout;
				}
			}
		}
		// If we reach this point; then a prerender statement does not exist
		if (layoutPath) {
			const p = path.join('src', 'routes', layoutPath);
			// The most preferred layout path exists
			const layoutContent = fs.readFileSync(p, 'utf-8');
			fs.writeFileSync(p, `${layoutContent}\nexport const prerender = true`);
		} else {
			// We need to create the layout
			const p = path.join('src', 'routes', layoutPaths[0]);
			fs.writeFileSync(p, `export const prerender = true`);
		}
	}

	// script({ content, filename, attributes }) {
	// 	if (filename?.endsWith("/routes/+layout.svelte") && attributes.context === "module") {
	//         return {
	//             code: `export const prerender = true;\n${content}`
	//         }
	//     }
	// }
};
