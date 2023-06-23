/**
 * 
 * @param {DatasourceSpec} source 
 * @param {PluginDatabases} supportedDbs
 */
export const execSource = async (source, supportedDbs) => {
    if (!(source.type in supportedDbs)) {
        // TODO: Make this error message better
        throw new Error(`Unsupported database type: ${source.type}`);
    }

    const db = supportedDbs[source.type];
    const runner = await db.factory(source.options, source.sourceDirectory);
    const results = await Promise.all(
        source.queries.map(async q => {
            return {
                ...q,
                result: await runner(q.content, q.filepath)
            }
        })
    )

    console.log(results)

}