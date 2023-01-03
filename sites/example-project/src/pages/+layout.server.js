import md5 from "blueimp-md5";

export const prerender = true

export async function load({fetch, url}) {
    const routeHash = md5(url.pathname)
    const res = await fetch(`/api/${routeHash}.json`);
    const {data} = await res.json();
    const customFormattingSettingsRes = await fetch('/api/customFormattingSettings.json');
    const { customFormattingSettings } = await customFormattingSettingsRes.json();
    return {
        data,
        customFormattingSettings
    }
}