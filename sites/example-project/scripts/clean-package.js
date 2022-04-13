// Runs after we package the components. Removes the publish config from the created package.json. 
// Leaving it in there trips up changesets (https://github.com/changesets/changesets/issues/773) 
// 

import fs from 'fs-extra'

let pkg = fs.readJsonSync('../../packages/components/package.json')

delete pkg.publishConfig

fs.writeJSONSync('../../packages/components/package.json', pkg)