import type { BeforeNavigate } from '@sveltejs/kit';
import { beforeNavigate } from '$app/navigation';
import type { CLIQueryService } from './CLIQueryService';

type Navigation = Pick<BeforeNavigate, 'from' | 'to' | 'willUnload'>;

// Query-only changes (filters, `?fullscreen`) stay on the page, and a full unload
// can still be cancelled by the user, so neither may kill the page's queries.
export function leavesPage({ from, to, willUnload }: Navigation): boolean {
	if (willUnload || !from || !to) return false;
	return from.url.pathname !== to.url.pathname;
}

// Runs before the navigation's own data request, which would otherwise wait
// behind this page's queries in the browser's per-host connection limit.
export function abandonQueriesOnLeave(queryService: Pick<CLIQueryService, 'abandon'>): void {
	beforeNavigate((navigation) => {
		if (leavesPage(navigation)) queryService.abandon();
	});
}
