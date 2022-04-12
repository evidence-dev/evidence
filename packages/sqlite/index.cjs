const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path')

const runQuery = async (queryString, database) => {
    const filename = database ? database.filename : process.env["SQLITE_FILENAME"] || process.env["filename"] || process.env["FILENAME"]

    try {
        const db = await open({
            filename: filename,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READONLY,
        })
        const result = await db.all(queryString);
        return result;    
    } catch(err) {
        if (err.message) {
            if(err.errno === 14){
                throw "Unable to open " + filename + " in " + path.resolve()
            } else {
                throw err.message
            }
        } else {
            throw err
        }
    }
}

module.exports = runQuery
