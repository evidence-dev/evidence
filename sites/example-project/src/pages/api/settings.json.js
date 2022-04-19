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
        if (fs.existsSync('../../.gitignore')) {
            gitIgnore = fs.readFileSync('../../.gitignore', 'utf8')
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
        let gitIgnore = fs.readFileSync('../../.gitignore', 'utf8')
        let extensions = [".db", ".sqlite", ".sqlite3"]
        if(settings.credentials.gitignoreSqlite === false){
            let regex
            extensions.forEach(ext => {
                // Find newline plus extension and only match those strings which are directly
                // followed by either a new line or the end of the file contents
                // (stops the issue of matching .sqlite within the .sqlite3 string)
                // g means global match - same behaviour as replaceAll
                regex = new RegExp(`\n${ext}(?=\n|$)`, "g")
                gitIgnore = gitIgnore.replace(regex, "")
            })
            fs.writeFileSync('../../.gitignore', gitIgnore)
        } else if(settings.credentials.gitignoreSqlite === true){
            extensions.forEach(ext => {
                regex = new RegExp(`\n${ext}(?=\n|$)`, "g")
                if(!gitIgnore.match(regex)){
                    gitIgnore = gitIgnore + ("\n" + ext)
                }
            })
            fs.writeFileSync('../../.gitignore', gitIgnore)
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