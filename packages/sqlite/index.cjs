const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const runQuery = async (queryString, database) => {

    try {
        const filename = database ? database.filename : process.env["SQLITE_FILENAME"] || process.env["filename"] || process.env["FILENAME"]
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
                throw "Unable to open database file in root of Evidence project"
            } else {
                throw err.message
            }
        } else {
            throw err
        }
    }
}

module.exports = runQuery
