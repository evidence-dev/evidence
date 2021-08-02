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

const runQuery = async (queryString, database) => {
    try {
        const keyFile = readJSONSync(database.keyFilename,  {throws:false}) 

        const connection = new BigQuery({
            projectId: keyFile.project_id ?? process.env["project_id"],
            credentials: {
              client_email: keyFile.client_email ?? process.env["client_email"],
              private_key: keyFile.private_key ?? process.env["private_key"].replace(/\\n/g, "\n") 
            }
        })

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