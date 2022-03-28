import { testConnection } from '@evidence-dev/db-orchestrator'

export async function post(request) {
    let result = await testConnection()

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