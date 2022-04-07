import fs from 'fs';
import { dev } from '$app/env';

export async function get() {
    if (!dev) {
        return {
            status: 404
        }
    }
    else { 
        let settings = {}

        if (fs.existsSync('evidence.settings.json')) {
            settings = JSON.parse(fs.readFileSync('evidence.settings.json', 'utf8'));
        }
        return {
            header: "accept: application/json",
            status: 200,
            body: {
                settings
            }
        }
    }
}


export function post(request) {
    const {settings} = JSON.parse(request.body)
    fs.writeFileSync('evidence.settings.json', JSON.stringify(settings));
    return {
        body: settings
    }
}

// Breaking changes in new verion of Svelte kit - merged on Jan 19, 2022
// https://github.com/sveltejs/kit/pull/3384
// Will need to change to format below once we upgrade our sveltekit dependency:
// export const post = async ({ request }) => {
//     const body = await request.formData();
//     const database = body.get("database");

//     return {
//         body: "settings saved"
//     }
// }