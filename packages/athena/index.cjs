const {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand
} = require('@aws-sdk/client-athena')

const { EvidenceType } = require('@evidence-dev/db-commons')

async function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function zip (keys, values) {
  keys.reduce((acc, k, i) => ({ ...acc, [k]: values[i] }), {})
}

async function awaitCompletion (client, QueryExecutionId) {
  while (true) {
    try {
      const { QueryExecution } = client.send(new GetQueryExecutionCommand({ QueryExecutionId }))
      const { Status } = QueryExecution
      if (Status.State === 'FAILED') {
        throw new Error(Status.StateChangeReason)
      }
      if (Status.State === 'CANCELLED') {
        throw new Error('CANCELLED')
      }
      if (Status.State === 'SUCCEEDED') {
        return
      }
      // else wait and retry
      await sleep(200)
    } catch (e) {
      if (e.message === 'TooManyRequestsException' ||
        e.message === 'ThrottlingException' ||
        e.message === 'NetworkingError' ||
        e.message === 'UnknownEndpoint') {
        await sleep(2000) // retry
      } else {
        throw e
      }
    }
  }
}

function standardizeResults (resultSet) {
  const [columnNames, ...data] = resultSet.Rows
  const keys = columnNames.Data.map(v => v.VarCharValue.toLowerCase())
  return data.map(row => zip(keys, row.Data.map(v => v.VarCharValue)))
}

function nativeTypeToEvidenceType (type) {
  switch (type) {
    case 'boolean':
      return EvidenceType.BOOLEAN
    case 'tinyint':
    case 'smallint':
    case 'integer':
    case 'bigint':
    case 'real':
    case 'double':
    case 'decimal':
      return EvidenceType.NUMBER
    case 'date':
    case 'time':
    case 'time with time zone':
    case 'timestamp':
    case 'timestamp with time zone':
      return EvidenceType.DATE
    case 'varchar':
    case 'char':
    case 'ipaddress':
    case 'uuid':
    case 'ipprefix':
    case 'varbinary':
    case 'json':
      return EvidenceType.STRING
    default: return null
  }
}

function convertToEvidence (columnInfo) {
  return columnInfo.map(column => {
    const name = column.Name.toLowerCase()
    let evidenceType = nativeTypeToEvidenceType(columnInfo.Type)
    let typeFidelity = 'precise'
    if (!evidenceType) {
      evidenceType = EvidenceType.STRING
      typeFidelity = 'inferred'
    }
    return { name, evidenceType, typeFidelity }
  })
}

async function loadAllResults (client, QueryExecutionId) {
  let NextToken = null
  let rows = []
  while (true) {
    const results = await client.send(new GetQueryResultsCommand({
      QueryExecutionId,
      NextToken
    }))
    rows = [...rows, standardizeResults(results.ResultSet)]
    if (!NextToken) {
      return {
        rows,
        columnTypes: convertToEvidence(results.ResultSet.ResultSetMetadata.ColumnInfo)
      }
    }
    NextToken = results.NextToken
  }
}

const runQuery = async (queryString, database) => {
  const region = database ? database.region : process.env.AWS_REGION
  const workgroup = database ? database.workgroup : process.env.ATHENA_WORKGROUP || process.env.ATHENA_DATABASE
  const location = database ? database.s3_location : process.env.ATHENA_S3_LOCATION
  const db = database ? database.name : process.env.ATHENA_DATABASE
  const credentials = {
    accessKeyId: database && database.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: database && database.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: database && database.sessionToken || process.env.AWS_SESSION_TOKEN
  }
  const client = new AthenaClient({ region, credentials })

  try {
    const { QueryExecutionId } = await client.send(new StartQueryExecutionCommand({
      QueryString: queryString,
      WorkGroup: workgroup,
      ResultConfiguration: { OutputLocation: location },
      QueryExecutionContext: { Database: db }
    }))

    await awaitCompletion(client, QueryExecutionId)
    const results = await loadAllResults(client, QueryExecutionId)
    return results
  } catch (err) {
    if (err.message) {
      throw err.message.replace(/\n|\r/g, ' ')
    } else {
      throw err.replace(/\n|\r/g, ' ')
    }
  }
}

module.exports = runQuery
