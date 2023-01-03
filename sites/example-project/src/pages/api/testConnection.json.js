import { testConnection } from '@evidence-dev/db-orchestrator'
import { dev } from '$app/env';

export async function POST() {
    let result = await testConnection(dev)

    if(result === "Database Connected"){
        return {
            headers: {
                "Content-Type": "application/json"
            },
            status: 200,
            body: JSON.stringify(result)
        }
    } else {
        return {
            headers: {
                "Content-Type": "application/json"
            },
            status: 500,
            body: JSON.stringify(result)
        }
    }


}