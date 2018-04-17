import express from 'express';
import path from 'path';
import {router} from "./routes";
import {dbconnectionManager} from "./DBConnectionManager";
import bodyParser from 'body-parser';
import {receiveTransactionsTask} from './ReceiveTransactionsTask'
import { syncTransactionTaskHelper } from './SyncTransactionTaskHelper';
import { commandLineUtils } from './CommandLineUtils';
import { disputeOrganizerTaskHelper } from './DisputeOrganizerTaskHelper';

(() => {
    const url = "mongodb://localhost:27017";
    const dbName = "onechainverifier";
    let app = express();
    app.use(bodyParser.urlencoded({
        extended: true
      }));
    router(app);

    let myArgs = process.argv.slice(2);
    let mode = "dev";
    if(myArgs.toString().indexOf('=') !== -1) {
        mode = myArgs.toString().split("=")[1];
    }

    dbconnectionManager.connect(url, dbName,mode, function(err) {
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

        syncTransactionTaskHelper.startSyncing();
        disputeOrganizerTaskHelper.disputeOrganizerTask();
        commandLineUtils.readCommands();
        
        // setInterval(function(){
        //     disputeHelper.DisputeOrganizerTask();
        // }, 1000*60*5);
    });
})();
