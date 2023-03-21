import md5 from "blueimp-md5";
import { GET } from "./api/customFormattingSettings.json/+server.js";
export const prerender = true; 
export const trailingSlash = 'always';

export async function load({fetch, route}) {
    console.info("route", route.id)
    if(route.id && route.id !== "/settings"){
        const routeHash = md5(route.id)
        // ensure that queries have been extracted before initiating the load process 
        console.time("fetch-status")
        let statusEndpoint = `/api/status${route.id}`.replace(/\/$/, "")
        await fetch(statusEndpoint);
        console.timeEnd("fetch-status")
        console.time("fetch-data")
        const res = await fetch(`/api/${routeHash}.json`);
        const {data} = await res.json();
        console.timeEnd("fetch-data")
    
        const customFormattingSettingsRes = await GET();
        const { customFormattingSettings } = await customFormattingSettingsRes.json();
        return {
            data,
            customFormattingSettings
        }
    }


}