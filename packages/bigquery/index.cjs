const {BigQuery} = require('@google-cloud/bigquery');
const {readJSONSync} = require('fs-extra');


const standardizeResult = async(result) => {
    var output = [];
    result.forEach(row => {
        const standardized = {};
        for (const [key, value] of Object.entries(row)) {
            if(typeof value === "object") {
                if(value) {
                    standardized[key] = value.value
                }else {
                    standardized[key] = null
                }
            } else {
                standardized[key] = value 
            }
        }   
        output.push(standardized);
    });
	return output;
}

const getCredentials = async(database) => {  
    try{  
        if(database){
            const keyFile = readJSONSync(database.keyFilename) 
            const creds = {
                projectId: keyFile.project_id ,
                credentials: {
                    client_email: keyFile.client_email,
                    private_key: keyFile.private_key  
                }
            }
            return creds
        }else{
            const creds = {
                projectId: process.env["project_id"] || process.env["PROJECT_ID"],
                credentials: {
                    client_email: process.env["client_email"] || process.env["CLIENT_EMAIL"],
                    private_key: (process.env["private_key"] || process.env["PRIVATE_KEY"]).replace(/\\n/g, "\n") 
                }
            }
            return creds
        }
    }catch {
        throw new Error('Missing database credentials')
    }
} 



const runQuery = async (queryString, database) => {
    try {
        const credentials = await getCredentials(database)
        const connection = new BigQuery(credentials)

        const [job] = await connection.createQueryJob({query: queryString });
        const [rows] = await job.getQueryResults();
        const standardizedResult = await standardizeResult(rows)
        return standardizedResult
    } catch (err) {
        if (err.errors) {
            throw err.errors[0].message           
        } else {
            throw err.message 
        }        
    }
};

module.exports = runQuery