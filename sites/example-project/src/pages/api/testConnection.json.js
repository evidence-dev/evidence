import {testConnection} from '@evidence-dev/db-orchestrator'

export async function post(request) {
    let success = await testConnection()

    if(success){
        return {
            body: "Database Connected"
        }
    } else {
        return {
            body: "Database Not Connected"
        }
    }

}