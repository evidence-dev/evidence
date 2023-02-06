import md5 from "blueimp-md5";
import { GET } from "./api/customFormattingSettings.json/+server.js";
// a bit gross but stops svelte from whining about prerendering endpoint with mutable methods
// TODO: find a better way to do this

export const prerender = 'auto';

export async function load({fetch, url}) {
    const routeHash = md5(url.pathname)

    const res = await fetch(`/api/${routeHash}.json`);
    const {data} = await res.json();

    const customFormattingSettingsRes = await GET();
    const { customFormattingSettings } = await customFormattingSettingsRes.json();
    
    return {
        data,
        customFormattingSettings
    }
}