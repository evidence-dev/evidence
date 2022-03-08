import fs from 'fs';

export async function get({params}) {
    let evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8'));

    return {
        header: "accept: application/json",
        body: {evidenceConfig}
    }
}


export function post(request) {
    const db = request.body.get('database')
    let evidenceConfig = JSON.parse(fs.readFileSync('evidence.config.json', 'utf8'));
    evidenceConfig.database = db
    fs.writeFileSync('evidence.config.json', JSON.stringify(evidenceConfig));
    return {
        location: "src/pages/settings.svelte"
    }
}
