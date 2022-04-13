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
        let gitIgnore
        if (fs.existsSync('evidence.settings.json')) {
            settings = JSON.parse(fs.readFileSync('evidence.settings.json', 'utf8'));
        }
        if (fs.existsSync('.gitignore')) {
            gitIgnore = fs.readFileSync('.gitignore', 'utf8')
        }
        return {
            header: "accept: application/json",
            status: 200,
            body: {
                settings,
                gitIgnore
            }
        }
    }
}


export function post(request) {
    const {settings} = JSON.parse(request.body)
    fs.writeFileSync('evidence.settings.json', JSON.stringify(settings));
    if(settings.database === "sqlite"){
        let gitIgnore = fs.readFileSync('.gitignore', 'utf8')
        if(settings.credentials.versionControl === true){
            fs.writeFileSync('.gitignore', gitIgnore.replaceAll("\n" + settings.credentials.filename, ""))
        } else if(settings.credentials.versionControl === false && !gitIgnore.includes(settings.credentials.filename)){
            fs.writeFileSync('.gitignore', gitIgnore + "\n" + settings.credentials.filename)
        }
    }
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