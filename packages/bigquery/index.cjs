const {BigQuery} = require('@google-cloud/bigquery');

var EvidenceType;
(function (EvidenceType) {
    EvidenceType["BOOLEAN"] = "boolean";
    EvidenceType["NUMBER"] = "number";
    EvidenceType["STRING"] = "string";
    EvidenceType["DATE"] = "date";
})(EvidenceType || (EvidenceType = {})); //TODO extract copied enum to common source

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
            const creds = {
                projectId: database.project_id ,
                credentials: {
                    client_email: database.client_email,
                    private_key: database.private_key  
                }
            }
            return creds
        }else{
            const creds = {
                projectId: process.env["BIGQUERY_PROJECT_ID"] || process.env["project_id"] || process.env["PROJECT_ID"],
                credentials: {
                    client_email: process.env["BIGQUERY_CLIENT_EMAIL"] || process.env["client_email"] || process.env["CLIENT_EMAIL"],
                    private_key: (process.env["BIGQUERY_PRIVATE_KEY"] || process.env["private_key"] || process.env["PRIVATE_KEY"]).replace(/\\n/g, "\n") 
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
        const [, , response] = await job.getQueryResults({
            autoPaginate: false,
        });
        const standardizedRows = await standardizeResult(rows);
        return { rows: standardizedRows, columnTypes : mapResultsToEvidenceColumnTypes(response) };
    } catch (err) {
        if (err.errors) {
            throw err.errors[0].message           
        } else {
            throw err.message 
        }        
    }
};

const nativeTypeToEvidenceType = function (nativeFieldType, defaultType = undefined) {
    switch (nativeFieldType) {
        case 'BOOL':
        case 'BOOLEAN':
          return EvidenceType.BOOLEAN;
        case 'INT64':
        case 'INT':
        case 'SMALLINT':
        case 'INTEGER':
        case 'BIGINT':
        case 'TINYINT':
        case 'BYTEINT':
        case 'DECIMAL':
        case 'NUMERIC':
        case 'BIGDECIMAL':
        case 'BIGNUMERIC':
        case 'FLOAT64':
          return EvidenceType.NUMBER;
        case 'STRING':
          return EvidenceType.STRING;
        case 'TIME':
        case 'TIMESTAMP':
        case 'DATE':
        case 'DATETIME':
          return EvidenceType.DATE;
        case 'STRUCT':
        case 'ARRAY':
        case 'BYTES':
        case 'GEOGRAPHY':
        case 'INTERVAL':
        case 'JSON':
        default:
          return defaultType;
    }
};

const mapResultsToEvidenceColumnTypes = function (results) {
    return results?.schema?.fields?.map(field => {
        let typeFidelity = 'precise';
        let evidenceType = nativeTypeToEvidenceType(field.type);
        if (!evidenceType) {
            typeFidelity = 'inferred';
            evidenceType = EvidenceType.STRING;
        }
        return (
          {
            'name': field.name,
            'evidenceType': evidenceType,
            'typeFidelity': typeFidelity,
          });
    });
};


module.exports = runQuery