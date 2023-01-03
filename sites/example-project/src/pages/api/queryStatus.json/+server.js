import fs from 'fs';
import { dev } from '$app/environment';

export async function GET() {
    if (!dev) {
        return new Response(undefined, { status: 404 })
    }
    else {
        let queryProgress = {}
        if (fs.existsSync('.evidence-queries/status.json')) {
            queryProgress = JSON.parse(fs.readFileSync('.evidence-queries/status.json', 'utf8'));
        }
        return json({ queryProgress })
    }
}
