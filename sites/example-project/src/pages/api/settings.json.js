import fs from 'fs';

export async function get({params}) {
    let evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8'));

    return {
        header: "accept: application/json",
        body: {
            evidenceConfig
        }
    }
}


export function post(request) {
    const formBody = JSON.parse(request.body)
    const db = formBody.database
    let evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8'));
    evidenceConfig.database = db
    fs.writeFileSync('evidence.config.json', JSON.stringify(evidenceConfig));
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