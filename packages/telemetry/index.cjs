const secure = require('@lukeed/uuid/secure');
const Analytics = require('analytics-node')
const { readJSONSync, writeJSONSync, pathExistsSync } = require('fs-extra')
const wK = 'ydlp5unBbi75doGz89jC3P1Llb4QjYkM'

const initializeProfile = async () => {  
    const projectProfile = {
        anonymousId: secure(), 
        traits: {
            projectCreated: new Date()
        }
    }
    writeJSONSync("./.profile.json", projectProfile, { throws: false })
    analytics.identify(projectProfile);
    return projectProfile 
}

const getProfile = async () => {
    if (!pathExistsSync("./.profile.json")) {
        return await initializeProfile()
    }  
    else {
        return readJSONSync("./.profile.json")
    }
}

const logEvent = async (eventName, dev) => {
    try {
        const config = readJSONSync("./evidence.config.json")
        const track = config.send_anonymous_usage_stats ?? true
        if(track){
            projectProfile = await getProfile()
            var analytics = new Analytics(wK);
            analytics.track({
                anonymousId:projectProfile.anonymousId,
                event: eventName,
                properties: {
                  devMode: dev 
                }
              });
        }
    }catch {
        // do nothing
    }
} 

module.exports = logEvent
