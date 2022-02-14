const mysql = require('mysql2');
const { Client } = require("ssh2");
const fs = require("fs");

const standardizeResult = async (result) => {
    var output = [];
    result.forEach(row => {
        const lowerCasedRow = {};
        for (const [key, value] of Object.entries(row)) {
            lowerCasedRow[key.toLowerCase()] = value;
        }
        output.push(lowerCasedRow);
    });
    return output;
}

// Host and port for SSH to start the tunnel
const LOCAL_TUNNEL_HOST = '127.0.0.1';
const LOCAL_TUNNEL_PORT = 13307;


// Establish only a single SSH tunnel for all mySQL connections
let tunnelClient = null;
let tunnelStream = null;
const buildTunnel = (database) => {
    // If a tunnel client is already established, return it
    if(tunnelStream)  {
        return Promise.resolve(tunnelStream);
    }

    return new Promise((resolve, reject) => {
        let sshConfig = {
            host: database ? database.ssh.host : process.env["ssh_host"],
            port: database ? database.ssh.port : process.env["ssh_port"],
            username: database ? database.ssh.user : process.env["ssh_user"]
        };

        if(database.ssh.password || process.env["ssh_password"]) {
            sshConfig.password = database ? database.ssh.password : process.env["ssh_password"];
        } else {
            sshConfig.privateKey = fs.readFileSync(database ? database.ssh.privateKeyPath : process.env["ssh_privateKeyPath"])
        }

        let forwardConfig = {
            sourceHost: LOCAL_TUNNEL_HOST,
            sourcePort: LOCAL_TUNNEL_PORT,
            destHost: database ? database.host : process.env["host"],
            destPort: database ? database.port : process.env["port"]
        };

        tunnelClient = new Client();
        tunnelClient.on('ready', () => {
            tunnelClient.forwardOut(forwardConfig.sourceHost, forwardConfig.sourcePort, 
                forwardConfig.destHost, forwardConfig.destPort, (err, stream) => {
                    if(err) reject(err);
                    tunnelStream = stream;
                    resolve(tunnelStream);
                });
        }).connect(sshConfig);
    })
}

const runQuery = async (queryString, database) => {
    try {
        const tunnelFlag = (database.tunnel && database.tunnel === "ssh" || process.env["tunnel"] === "ssh")
        let stream = null;
        if(tunnelFlag) {
            stream = await buildTunnel(database);
        }

        const credentials = {
            user: database ? database.user : process.env["user"],
            host: database ? database.host : process.env["host"],
            database: database ? database.database : process.env["database"],
            password: database ? database.password : process.env["password"],
            port: database ? database.port : process.env["port"],
            ssl: database ? database.ssl : process.env["ssl"] ?? false,
            socketPath: database ? database.socketPath : process.env["socketPath"] ?? "",
            decimalNumbers: true,

            // Conditionally add stream key
            ...(stream && {stream})
        }

        var pool = mysql.createPool(credentials);
        const promisePool = pool.promise();
        const [rows, fields] = await promisePool.query(queryString);

        const stardizedResults = await standardizeResult(rows)

        return stardizedResults
    }
    catch (err) {
        if (err.message) {
            throw err.message.replace(/\n|\r/g, " ")
        } else {
            throw err.replace(/\n|\r/g, " ")
        }
    }
}

module.exports = runQuery