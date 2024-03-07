import initUsqlPromise from '$evidence/initUsql';
import { runQuery, setSsrHookState } from '$evidence/queries';

setSsrHookState(true);

/**
 * SvelteKit server hook to enable SSR
 * @param {Array<{name: string, queryString: string}>} presentQueries
 * @returns {(chunk: {html: string, done:boolean}) => Promise<string>}
 */
export const ssrHook =
	(presentQueries) =>
	async ({ html, done }) => {
		const regex = /<meta evidence-query-presence="(.+?)" evidence-query-content="((?:.|\s)+?)">/g;
		let queryMatch;

		while ((queryMatch = regex.exec(html) ?? []).length) {
			if (queryMatch)
				presentQueries.push({
					name: queryMatch[1],
					queryString: queryMatch[2].replaceAll('&quot;', '"')
				});
		}

		const loadDetectedQueries = async () => {
			await initUsqlPromise;
			const results = await Promise.all(
				presentQueries.map(async ({ name, queryString }) => {
					const result = runQuery(`${name}-ssr`, `--ssr\n${queryString}`, {
						disableCache: true
					});

					await result.fetch();
					if ((result.length && result[0] === null) || result[0] === undefined)
						throw new Error(`Failed to render queries via SSR`);
					if (result.error) throw result.error;
					return [
						name,
						{
							data: Array.from(result),
							columns: result.columns,
							initialQuery: queryString
						}
					];
				})
			);

			return Object.fromEntries(results);
		};

		if (done) {
			const r = await loadDetectedQueries();
			html = html.replace(
				'<script>',
				`<script>
            window.__evidence_ssr = ${JSON.stringify(r)}\n`
			);
		}
		return html;
	};
