const PrismComponents = require("prismjs/components");
const { supportedLangs } = require("./supportedLanguages.cjs");

const getPrismLangs = function(){
    let prismLangs= new Set()
    
    supportedLangs.forEach((supportedLanguage) => {
        prismLangs.add(supportedLanguage)
        if (supportedLanguage in PrismComponents.languages) {
            const languageComponent = PrismComponents.languages[supportedLanguage]
            if (languageComponent.alias) {
                if (Array.isArray(languageComponent.alias)) {
                    languageComponent.alias.forEach(a => prismLangs.add(a))
                } else {
                    prismLangs.add(languageComponent.alias)
                }
            }
        }
    })

    return prismLangs
}
module.exports = getPrismLangs