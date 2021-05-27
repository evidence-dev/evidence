import { BigQuery } from '@google-cloud/bigquery'
import md5 from 'blueimp-md5'
import fsExtra from 'fs-extra'
const { writeJSONSync, readdirSync, readJSONSync, mkdirSync, pathExistsSync, emptyDirSync } = fsExtra

const runQuery = async (queryString, database, dev) => {
  if(!pathExistsSync(database.keyFilename)){
    console.log("Missing database credentials")
    return {error: {message: "Missing database credentials"}}
  }

  const bigquery = new BigQuery({
      projectId: database.projectId,
      keyFilename: database.keyFilename
  })
  
  if(queryString.length === 0){
    return {error: {message: "Enter a query"}}
  } 
  let queryTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours());
  queryTime = md5(queryTime)
  if(!pathExistsSync("./.evidence/dev")){
    mkdirSync("./.evidence/dev")
  }
  if(!pathExistsSync("./.evidence/dev/cache/")){
    mkdirSync("./.evidence/dev/cache/")
  }
  if(!pathExistsSync("./.evidence/dev/cache/"+queryTime)){
    emptyDirSync('./.evidence/dev/cache/')
    mkdirSync("./.evidence/dev/cache/"+queryTime)
  }
  if(dev){
    const devCache = readJSONSync("./.evidence/dev/cache/"+queryTime+"/"+md5(queryString)+".json", {throws: false})
    if(devCache){
      console.log("cached results")
      return devCache
    }
  }
  const options = {
    query: queryString,
    location: database.location,
  };
  try {
    console.log("running...")
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    console.log("done")
    if(dev){
      writeJSONSync("./.evidence/dev/cache/"+queryTime+"/"+md5(queryString)+".json", rows, {throws: false})
    }   
    return rows
  } catch(error){
      console.log("error")
      return {'error': error.errors[0]}
  }
};

const runQueries = async function(routeHash, database, dev){
  let routePath = `./.evidence/build/queries/${routeHash}`
  let queryFile = `${routePath}/${readdirSync(routePath)}`
  let queries = readJSONSync(queryFile, {throws: false})

  if(queries.length>0){
    let data = {}
    for(let query of queries ){
      if(query.id === 'untitled'){
        data[query.id] = {error: {message: "Queries require a title"}}
      }    
      else{
        console.log("\n"+query.id+":")
        data[query.id] = await runQuery(query.queryString, database, dev)
      } 
    }
    return data
  }
}

export default runQueries 