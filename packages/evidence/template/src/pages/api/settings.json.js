import fs from 'fs';

export async function get() {
    let evidenceConfig = {}
    let databaseConfig = {}

    if (fs.existsSync('evidence.config.json')) {
        evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8', ));
    }

    if (fs.existsSync('evidence.settings.json')) {
        databaseConfig = JSON.parse(fs.readFileSync('evidence.settings.json', 'utf8'));
    }

    return {
        header: "accept: application/json",
        body: {
            evidenceConfig,
            databaseConfig
        }
    }
}


export function post(request) {
    const formBody = JSON.parse(request.body)
    const db = formBody.database
    let evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8'));
    evidenceConfig.database = db
    fs.writeFileSync('evidence.config.json', JSON.stringify(evidenceConfig));

    const credentials = formBody.credentials
    fs.writeFileSync('evidence.settings.json', JSON.stringify(credentials));

    return {
        body: "settings saved"
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