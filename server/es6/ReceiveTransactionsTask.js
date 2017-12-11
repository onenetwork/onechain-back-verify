import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';
import {backChainUtil} from  './BackChainUtil';

class ReceiveTransactionsTask {
    constructor() {}

    callGetMessages(authenticationToken, chainOfCustodyUrl, callback) {
        fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/consume?limitInKb=1024'), {
            method: 'get',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + new Buffer('ScottRepAnalyst' + ':' + 'password').toString('base64')
            })
        }).then(function(response) {
            return response.json();
        }).then(function(result) {
            console.log(result);
            callback(null, result);
        }).catch(function (err) {
            callback(err, null);
        });
    }

    consumeTransactionMessages(authenticationToken, chainOfCustodyUrl, callback) {
        let me = this;
        this.callGetMessages(authenticationToken, chainOfCustodyUrl, function(error, result) {
            if(error) {
                console.log(error);
                if(typeof callback !== 'undefined') {
                    callback(error, {syncDone : false});
                }
            } else {
                let hasMorePages = result.hasMorePages || false;
                me.insertMessages(result.transactionMessages);
                let lastSyncTimeInMillis = me.insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl);

                if(hasMorePages) {
                    me.consumeTransactionMessages(authenticationToken, chainOfCustodyUrl);
                } else if(!hasMorePages) {
                    setTimeout(function() {
                        me.consumeTransactionMessages(authenticationToken, chainOfCustodyUrl); /*Don't pass callback, because result already sent to client*/
                    }, config.readFileTimeInMillis);
                }

                if(typeof callback !== 'undefined') {
                    callback(null, {syncDone : true, authenticationToken: authenticationToken, chainOfCustodyUrl: chainOfCustodyUrl, lastSyncTimeInMillis: lastSyncTimeInMillis});
                }
            }
        });
    }

    insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl) {
        let lastSyncTimeInMillis = new Date().getTime();
        let settingsCollection = null;

        /* finding settingsCollection, because there could be "blockChain" related setup already present */
        dbconnectionManager.getConnection().collection("Settings").findOne({type: 'applicationSettings'}, function(err, result) {
            if (err) throw err;
            if (result) {
                settingsCollection = result;
            }

            let writeValue = null;
            if(settingsCollection) {
                settingsCollection.chainOfCustidy = {
                    "authenticationToken" : authenticationToken,
                    "lastSyncTimeInMillis": lastSyncTimeInMillis,
                    "chainOfCustodyUrl": chainOfCustodyUrl
                }
                writeValue = settingsCollection;
            } else {
                writeValue = {
                    "type" : "applicationSettings",
                    chainOfCustidy: {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis": lastSyncTimeInMillis,
                        "chainOfCustodyUrl": chainOfCustodyUrl
                    }
                }
            };

            dbconnectionManager.getConnection().collection("Settings").updateOne({type: 'applicationSettings'}, {$set: writeValue}, { upsert: true }, function(err, res) {
                if (err) {
                    //throw err;
                    //Error shouldn't bubble, we need to log and move on 
                    console.error(err);
                }
                else if(res) {
                    console.log('Setting time updated successfully!');
                }
            });
        });

        return lastSyncTimeInMillis;
    }

    insertMessages(transMessages) {
        for (let i = 0; i < transMessages.length; i++) {
            let document = this.convertKafkaToMongoEntry(transMessages[i]);
            dbconnectionManager.getConnection().collection('Transactions').update({
                    "id": document.id
                },
                 document , {
                    upsert: true
                }
            )
        }
    }

    convertKafkaToMongoEntry(transMessage) {
        let serializedList = transMessage.transactionsSlicesSerialized;
        let transactionSliceObjects = [];
        for (let i = 0; i < serializedList.length; i++) {
            let serialized = serializedList[i];
            transactionSliceObjects.push(JSON.parse(serialized));
        }
        transMessage.transactionSlices = transMessage.transactionsSlicesSerialized;
        delete transMessage.transactionsSlicesSerialized;
        delete transMessage.transactionsSlices;
        transMessage.transactionSliceObjects = transactionSliceObjects;
        return transMessage;
    }

}

export const receiveTransactionsTask = new ReceiveTransactionsTask();