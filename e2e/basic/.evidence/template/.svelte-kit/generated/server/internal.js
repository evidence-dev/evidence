
import root from '../root.svelte';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_dir: "_app",
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" sizes=\"32x32\" />\n\t\t<link rel=\"icon\" href=\"/icon.svg\" type=\"image/svg+xml\" />\n\t\t<link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\" />\n\t\t<!-- 180×180 -->\n\t\t<link rel=\"manifest\" href=\"/manifest.webmanifest\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<script>\n\t\t\t/*loading*/\n\t\t</script>\n\t\t<div>\n\t\t\t<!-- SvelteKit Hydrated Content -->\n\t\t\t" + body + "\n\n\t\t\t<!-- SplashScreen -->\n\t\t\t<div aria-disabled id=\"__evidence_project_splash\" style=\"visibility: hidden\">\n\t\t\t\t<svg width=\"100\" height=\"100\" viewBox=\"-8 -8 588 588\" xmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t\t\t<path\n\t\t\t\t\t\td=\"M7.19462e-05 74.3583C109.309 74.3583 195.795 86.2578 286.834 37.825C377.872 -10.6077 466.416 1.29174 573.667 1.29175L573.667 126.549C466.416 126.549 377.373 114.91 286.834 163.082C196.294 211.254 109.309 199.615 6.11417e-05 199.615L7.19462e-05 74.3583Z\"\n\t\t\t\t\t\tclass=\"draw-path\"\n\t\t\t\t\t/>\n\t\t\t\t\t<path\n\t\t\t\t\t\td=\"M573.669 499.31C464.36 499.31 377.874 487.411 286.835 535.843C195.797 584.276 107.252 572.377 0.0014801 572.377V447.12C107.252 447.12 196.295 458.758 286.835 410.586C377.375 362.415 464.36 374.053 573.669 374.053V499.31Z\"\n\t\t\t\t\t\tclass=\"draw-path2\"\n\t\t\t\t\t/>\n\t\t\t\t\t<path\n\t\t\t\t\t\td=\"M452.896 186.499C395.028 187.686 341.581 194.947 286.835 224.074C211.396 264.212 136.995 262.826 52.2355 261.247C35.2696 260.931 17.8887 260.608 0.0014801 260.608V385.865C18.1032 385.865 35.6721 386.204 52.81 386.534C137.212 388.162 211.162 389.589 286.835 349.331C341.838 320.07 395.18 312.831 452.896 311.685V186.499Z\"\n\t\t\t\t\t\tclass=\"draw-path3\"\n\t\t\t\t\t/>\n\t\t\t\t</svg>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n\n<style>\n\t#__evidence_project_splash {\n\t\tposition: fixed;\n\t\ttop: 0;\n\t\tleft: 0;\n\t\twidth: 100vw;\n\t\theight: 100vh;\n\t\tbackground-color: #ffffff;\n\t\tdisplay: flex;\n\t\tjustify-content: center;\n\t\talign-items: center;\n\t\tz-index: 9999;\n\t}\n\n\t.draw-path,\n\t.draw-path2,\n\t.draw-path3 {\n\t\tfill: #000000;\n\t\tanimation: blinking-logo 2s;\n\t\tanimation-fill-mode: both;\n\t\tanimation-iteration-count: infinite;\n\t\tanimation-timing-function: ease-in-out;\n\t}\n\n\t@keyframes blinking-logo {\n\t\t0% {\n\t\t\tfill-opacity: 1;\n\t\t}\n\t\t50% {\n\t\t\tfill-opacity: 0.2;\n\t\t}\n\t\t100% {\n\t\t\tfill-opacity: 1;\n\t\t}\n\t}\n</style>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "chorcq"
};

export async function get_hooks() {
	return {
		...(await import("../../../src/hooks.server.js")),
		
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation, set_safe_public_env };
