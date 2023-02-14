import md5 from "blueimp-md5";
import { GET } from "./api/customFormattingSettings.json/+server.js";

export const prerender = true; 
export const trailingSlash = 'always';

export async function load({fetch, route}) {   

    if(route.id){
        const routeHash = md5(route.id)

        // ensure that queries have been extracted before initiating the load process 
        let statusEndpoint = `/api/status${route.id}`.replace(/\/$/, "")
        await fetch(statusEndpoint);
        
        const res = await fetch(`/api/${routeHash}.json`);
        const {data} = await res.json();
    
        const customFormattingSettingsRes = await GET();
        const { customFormattingSettings } = await customFormattingSettingsRes.json();
        
        return {
            data,
            customFormattingSettings
        }
    }


}