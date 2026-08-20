import { getContext, setContext } from 'svelte';

const ASSET_DELIVERY_CONTEXT_KEY = Symbol('ASSET_DELIVERY_CONTEXT');

/**
 * Lets the host app rewrite the URL used to fetch private uploaded assets
 * (images) so they load in contexts where the browser can't present the app
 * session — chiefly embedded reports, which run in a third-party iframe where
 * the SameSite cookie is not sent and an `<img>` can't carry an auth header.
 *
 * The embedded layout sets this to append the embed token as a query param the
 * image proxy accepts. Everywhere else (editor, published, PDF) it's unset and
 * the plain same-origin proxy path is used with the first-party session cookie.
 */
export interface AssetDeliveryContext {
	authorize: (url: string) => string;
}

export const setAssetDeliveryContext = (context: AssetDeliveryContext) =>
	setContext(ASSET_DELIVERY_CONTEXT_KEY, context);

export const getAssetDeliveryContext = (): AssetDeliveryContext | undefined =>
	getContext(ASSET_DELIVERY_CONTEXT_KEY);
