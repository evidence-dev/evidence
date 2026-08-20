/**
 * Injects the author's HTML body into the sandbox DOM and executes its scripts.
 *
 * Two browser facts drive this:
 *   1. Setting `innerHTML` parses markup but does NOT run any `<script>` in it
 *      (HTML5 spec). So we splice the static markup in, then re-create each
 *      script node so it actually executes.
 *   2. A classic inline `<script>` can't use top-level `await`. Authors expect
 *      to write `const rows = await evidence.query("orders")` at the top level
 *      (it's the whole point of the SDK), so we wrap classic inline script
 *      bodies in an async IIFE. This also scopes their `const`/`let` to the
 *      function, avoiding global collisions across blocks.
 *
 * Ordering: external `src` scripts (CDN libraries) are awaited before the next
 * script runs, so a later inline script can rely on a library it pulled in.
 * `<script type="module">` is respected as-is — modules support native
 * top-level await and `import`, and the author opted into module semantics.
 *
 * Errors in a wrapped inline script are routed to `console.error` (which the
 * shared bootstrap forwards to the parent's diagnostics pipeline) rather than
 * thrown, so one bad block doesn't abort the rest of the body.
 */

const MOUNT_ID = 'evidence-html-root';

/**
 * True if the markup contains a `<script>` element. Used by the runtime to
 * decide whether it can auto-signal render completion: script-free HTML is
 * done the instant it's injected, whereas a block with scripts may still be
 * drawing asynchronously (a CDN import or `evidence.query` await), so its
 * accurate completion frame comes from `evidence.ready()` instead.
 *
 * Deliberately conservative — a `<script>` mentioned inside a string or comment
 * counts as a match, which only means we wait for `evidence.ready()`/the safety
 * timeout rather than completing early. Capturing a blank frame is the worse
 * failure, so we err toward waiting.
 */
export function htmlHasScript(html: string): boolean {
	return /<script[\s/>]/i.test(html);
}

/** Returns the root element author HTML is mounted into (created if absent). */
function getRoot(): HTMLElement {
	let root = document.getElementById(MOUNT_ID);
	if (!root) {
		root = document.createElement('div');
		root.id = MOUNT_ID;
		document.body.appendChild(root);
	}
	return root;
}

function isModule(script: HTMLScriptElement): boolean {
	return (script.getAttribute('type') ?? '').toLowerCase() === 'module';
}

/** Re-create one script node so the browser executes it; resolve when done. */
function runScript(original: HTMLScriptElement): Promise<void> {
	return new Promise((resolve) => {
		const replacement = document.createElement('script');
		for (const attr of Array.from(original.attributes)) {
			replacement.setAttribute(attr.name, attr.value);
		}

		const src = original.getAttribute('src');
		if (src) {
			// External (CDN) script — await load so subsequent inline code can
			// use whatever global it registers. Resolve (not reject) on error so
			// a single failed CDN doesn't wedge the whole body; the failure is
			// already visible via the runtime's window 'error' forwarding.
			replacement.addEventListener('load', () => resolve());
			replacement.addEventListener('error', () => {
				console.error(`Failed to load script: ${src}`);
				resolve();
			});
			original.replaceWith(replacement);
			return;
		}

		const code = original.textContent ?? '';
		if (isModule(original)) {
			// Module scripts support top-level await + import natively; run as-is.
			// Inline modules don't fire a reliable execution-complete event, so
			// we resolve on the next tick (best-effort ordering).
			replacement.textContent = code;
			original.replaceWith(replacement);
			queueMicrotask(resolve);
			return;
		}

		// Classic inline script: wrap so top-level await works and author
		// locals don't leak to the global scope.
		replacement.textContent = `(async () => {\n${code}\n})().catch((e) => console.error(e));`;
		original.replaceWith(replacement);
		// The IIFE body may await; we don't block the next script on it (matches
		// normal script semantics — async work continues in the background).
		resolve();
	});
}

/**
 * Mount `html` and execute its scripts in document order. Resolves once every
 * script has STARTED (external loads awaited, async inline bodies left running)
 * — enough for the runtime to report a first render. Authors that need a
 * precise readiness signal (e.g. PDF capture after an async draw) call
 * `evidence.ready()`.
 */
export async function injectAndRun(html: string): Promise<void> {
	const root = getRoot();
	const template = document.createElement('template');
	template.innerHTML = html;
	root.replaceChildren(template.content);

	const scripts = Array.from(root.querySelectorAll('script'));
	for (const script of scripts) {
		await runScript(script);
	}
}
