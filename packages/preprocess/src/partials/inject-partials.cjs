const fs = require("fs")
const path = require("path")

/**
 * @param {string} originalString
 * @returns {string}
 */
function injectPartials(originalString) {
    const r = /\{@partial\s+"(.*?)"\s*\}/g;
    
    for (const match of originalString.matchAll(r) ?? []) {
        const filename = match[1]
        // There is an error with parcel that prevents the use of the "path" library.
        const content = fs.readFileSync(`./partials/${match[1]}`).toString()
        
        originalString = originalString.replace(match[0], content)    
    }
    
    return originalString;
}

module.exports = {
    markup: ({content, filename}) => {
        if (typeof filename === 'undefined') return;
        if (!filename.endsWith('+page.md')) return;
        return {
            code: injectPartials(content)
        }        
    },
    injectPartials
}
