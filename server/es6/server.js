import express from 'express';
import path from 'path';
import {router} from "./routes";
import {dbconnectionManager} from "./DBConnectionManager";
import bodyParser from 'body-parser';
// import {receiveTransactionsTask} from './ReceiveTransactionsTask'

(() => {
    let url = "mongodb://localhost:27017/onechainverifier";
    let app = express();
    app.use(bodyParser.urlencoded({
        extended: true
      }));
    router(app);

    dbconnectionManager.connect(url, function(err) {
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
        
    //    receiveTransactionsTask.callSetInterval();

    });
})();