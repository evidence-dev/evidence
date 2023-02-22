import unified  from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import md5 from "blueimp-md5";
import fs from "fs-extra";

const strictBuild = (process.env.VITE_BUILD_STRICT === 'true')
const circularRefErrorMsg = 'Compiler error: circular reference'

// Unified parser step to ignore indented code blocks. 
// Adapted from the mdsvex source, here: https://github.com/pngwn/MDsveX/blob/master/packages/mdsvex/src/parsers/index.ts
// Discussion & background here:  https://github.com/evidence-dev/evidence/issues/286
const ignoreIndentedCode = function() {
	const Parser = this.Parser;
	const block_tokenizers = Parser.prototype.blockTokenizers;
	block_tokenizers.indentedCode = () => true;
}

const updateDirectoriesandStatus = function (queries, routeHash) {
  let queryDir = `./.evidence-queries/extracted/${routeHash}`;

  fs.ensureDirSync(queryDir);

  const existingQueries = fs.readJSONSync(`${queryDir}/queries.json`, {
    throws: false,
  });

  queries.forEach((query) => {
    query.queryStringMD5 = md5(query.compiledQueryString);
    if(existingQueries){
        let existingQuery = existingQueries.find(
            (existing) =>
              existing.id === query.id &&
              existing.queryStringMD5 === query.queryStringMD5
          );
          if (existingQuery) {
            query.status = existingQuery.status;
          } else {
            query.status = "not run";
          }
    }else{
        query.status = "not run";
    }   
  });

  if (queries.length === 0) {
    fs.emptyDirSync(queryDir);
  } else {
    fs.writeJSONSync(`${queryDir}/queries.json`, queries);
  }

  let status = queries.map((query) => {
    return { id: query.id, status: query.status };
  });

  return status;
};

export const getStatusAndExtractQueries = function (route) {
  let routeHash = md5(route);
  let content = fs.readFileSync(`./src/pages/${route}/+page.md`);
  content = content ? content.toString() : null;

  if(content){
      let queries = [];
      let tree = unified()
        .use(remarkParse)
        .use(ignoreIndentedCode)
        .parse(content);
    
      visit(tree, "code", function (node) {
        let id = node.lang ?? "untitled";
        let compiledQueryString = node.value.trim(); // refs get compiled and sent to db orchestrator
        let inputQueryString = compiledQueryString; // original, as written
        let compiled = false; // default flag, switched to true if query is compiled
        queries.push({
          id,
          compiledQueryString,
          inputQueryString,
          compiled,
        });
      });
    
        // Handle query chaining:
        let maxIterations = 15
        let queryIds = queries.map(d => d.id);
    
        for(let i=0; i<=maxIterations; i++){
            queries.forEach(query => {
                let references = query.compiledQueryString.match(/\${.*?\}/gi)	
                if(references){
                    query.compiled = true
                    references.forEach(reference => {
                        try {
                            let referencedQueryID = reference.replace("${", "").replace("}", "").trim()
                            if(!queryIds.includes(referencedQueryID)){
                                let errorMessage = 'Compiler error: '+ (referencedQueryID === "" ? "missing query reference" :"'"+ referencedQueryID + "'" + " is not a query on this page")
                                throw new Error(errorMessage)
                            } else if(i >= maxIterations) {
                                throw new Error(circularRefErrorMsg)
                            } else {
                                let referencedQuery = "(" + queries.filter(d => d.id === referencedQueryID)[0].compiledQueryString + ")"
                                query.compiledQueryString = query.compiledQueryString.replace(reference, referencedQuery)
                            }
                        }catch(e){
                            // if error is unknown use default circular ref. error
                            e = (e.message === undefined || e.message === null) ? Error(circularRefErrorMsg) : e
                            query.compileError = e.message
                            query.compiledQueryString = e.message
                            // if build is strict and we detect an error, force a failure
                            if (strictBuild){
                                throw new Error(e.message)
                            }
                        }
                    }) 
                } 
            })
        }
    
      let queryStatus = updateDirectoriesandStatus(queries, routeHash);
      return queryStatus;
  } else {
      return [{}] // a little jank
  }
};
