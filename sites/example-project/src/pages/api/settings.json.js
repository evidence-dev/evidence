import fs from 'fs';
import path from 'path';
import gitRemoteOriginUrl from 'git-remote-origin-url'; // get the git repo
import { dev } from '$app/env';
import logEvent from '@evidence-dev/telemetry'; 

function getLocalGitRepo () {
    if(fs.existsSync(path.join(path.resolve('../../'), '.git'))){
        return path.resolve('../../') 
    }
}

export async function GET() {
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
        try{
            settings.localGitRepo = getLocalGitRepo();
            settings.gitRepo = await gitRemoteOriginUrl()
        }catch {
            
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


export async function POST({request}) {    
    const {settings} = await request.json();
    // read original settings file 
    let originalSettings = {}
    if (fs.existsSync('evidence.settings.json')) {
        originalSettings = JSON.parse(fs.readFileSync('evidence.settings.json', 'utf8'));
    } 
    // check if send_anonymous_usage_stats has changed and log an event if it has changed from not 'no' (or undefined) to no
    if(originalSettings.send_anonymous_usage_stats != 'no' && settings.send_anonymous_usage_stats === 'no'){
        logEvent('usageStatsDisabled', dev, originalSettings)
    }
    fs.writeFileSync('evidence.settings.json', JSON.stringify(settings));
    if(settings.database === "sqlite"){
        let gitIgnore;
        let hasGitIgnore = fs.existsSync('../../.gitignore');
        gitIgnore = hasGitIgnore ? fs.readFileSync('../../.gitignore', 'utf8') : "";
        let extensions = [".db", ".sqlite", ".sqlite3"]
        if(settings.credentials.gitignoreSqlite === false){
            let regex
            if(hasGitIgnore){
                extensions.forEach(ext => {
                    // Find newline plus extension and only match those strings which are directly
                    // followed by either a new line or the end of the file contents
                    // (stops the issue of matching .sqlite within the .sqlite3 string)
                    // g means global match - same behaviour as replaceAll
                    regex = new RegExp(`\n${ext}(?=\n|$)`, "g")
                    gitIgnore = gitIgnore.replace(regex, "")
                })
                fs.writeFileSync('../../.gitignore', gitIgnore)
            }
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