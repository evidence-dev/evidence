import fs from 'fs';
import { dev } from '$app/env';

export async function GET() {
    if (!dev) {
        return {
            status: 404
        }
    }
    else {
        let queryProgress = {}
        if (fs.existsSync('.evidence-queries/status.json')) {
            queryProgress = JSON.parse(fs.readFileSync('.evidence-queries/status.json', 'utf8'));
        }
        return {
            header: "accept: application/json",
            status: 200,
            body: {
                queryProgress
            }
        }
    }
}
