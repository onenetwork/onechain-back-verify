import express from 'express';
import path from 'path';
import {router} from "./routes";
import {dbconnectionManager} from "./DBConnectionManager";
import bodyParser from 'body-parser';
import {receiveTransactionsTask} from './ReceiveTransactionsTask'
import { syncTransactionTaskHelper } from './SyncTransactionTaskHelper';
import { commandLineUtils } from './CommandLineUtils';


let ARG_CONFIGS = {
    'mode': {
        type: 'string',
        defaultValue: 'dev'
    },
    'create-sync-gaps': {
        varName: 'createSyncGaps',
        type: 'boolean',
        defaultValue: false
    }
};

(() => {
    const url = "mongodb://localhost:27017";
    const dbName = "onechainverifier";
    let app = express();
    app.use(bodyParser.urlencoded({
        extended: true
      }));
    router(app);

    let args = processArgs();
    dbconnectionManager.connect(url, dbName, args.mode, function(err) {
        if (err) {
            throw err;
        }
        console.log("Database created!");
        let server = app.listen(8081, function() {
            let host = server.address().address
            let port = server.address().port
            console.log("Example app listening at http://%s:%s", host, port)
        });
        app.use(express.static(path.join(__dirname, "../public")));

        app.get('*', function(req, res) {
            res.sendFile(path.join(__dirname + "/../" + "index.html"));
        });

        syncTransactionTaskHelper.startSyncing(args);
        commandLineUtils.readCommands();
    });
})();

// Process command-line arguments.
function processArgs() {
    let args = {};

    let commandLineArgs = process.argv.slice(2);
    for(let commandLineArg of commandLineArgs) {
        let idx = commandLineArg.indexOf('=');
        let argName, argValue;
        if(idx > 0) {
            argName = commandLineArg.substring(0, idx);
            argValue = commandLineArg.substring(idx + 1);
        }
        else {
            argName = commandLineArg;
            argValue = true;
        }

        // Trim the prefix from the argument.
        argName = argName.trim().replace(/^-*/, "");

        if(!(argName in ARG_CONFIGS)) {
            continue;
        }

        setArgValue(args, argName, argValue);
        delete ARG_CONFIGS[argName];
    }

    // Set default values for missing args.
    for(let argName in ARG_CONFIGS) {
        setArgValue(args, argName);
    }

    return args;
}

function setArgValue(args, argName, argValue) {
    let argConfig = ARG_CONFIGS[argName];
    if(argConfig.type === 'boolean') {
        argValue = argValue === true || argValue === 'true' || argValue === '1';
    }

    let varName = argConfig.varName || argName;
    args[varName] = argValue || argConfig.defaultValue;
}
