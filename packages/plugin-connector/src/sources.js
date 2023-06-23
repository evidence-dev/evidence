import { getSources, getSourcesDir } from "./data-sources/get-sources"
import { getDatasourcePlugins } from "./data-sources/get-datasource-plugins"

async function main() {
    const datasourceDir = await getSourcesDir()
    if (!datasourceDir) throw new Error('missing sources directory')
    const datasources = await getSources(datasourceDir)
    console.log(datasources)
    const plugins = await getDatasourcePlugins()
    console.log(plugins)
}

main().catch(console.error)