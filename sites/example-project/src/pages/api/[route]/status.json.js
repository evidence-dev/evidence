import fs from 'fs';

export async function get({params}) {
  const { route } = params;
  let status = []
  let queries

  if (fs.existsSync(`./.evidence-queries/extracted/${route}`)) {
    let routePath = `./.evidence-queries/extracted/${route}`
    let queryFile = `${routePath}/${fs.readdirSync(routePath)}`
    queries = JSON.parse(fs.readFileSync(queryFile, { throws: false }))

    queries.forEach(query => {
        status.push({id: query.id, status: query.status})
    });
  }   

  return {
      body: {
        status
      }
  };
}