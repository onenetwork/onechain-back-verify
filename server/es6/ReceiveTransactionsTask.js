import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';
import {backChainUtil} from  './BackChainUtil';

class ReceiveTransactionsTask {
    constructor() {}

    callGetMessages(authenticationToken, backChainURL, callback) {
        fetch(backChainUtil.returnValidURL(backChainURL + '/oms/rest/backchain/v1/consume?limitInKb=1024'), {
            method: 'get',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + new Buffer('ProgressiveRetailerVCAdmin' + ':' + 'password').toString('base64')
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

    consumeTransactionMessages(authenticationToken, backChainURL, callback) {
        let me = this;
        this.callGetMessages(authenticationToken, backChainURL, function(error, result) {
            if(error) {
                console.log(error);
                if(typeof callback !== 'undefined') {
                    callback(error, {syncDone : false});
                }
            } else {
                console.log('hasMorePages: ' + result.hasMorePages);
                me.insertMessages(result.transactionMessages);
                let lastSyncTimeInMillis = me.insertOrUpdateSettings(authenticationToken, backChainURL);

                if(result.hasMorePages) {
                    me.consumeTransactionMessages(authenticationToken, backChainURL);
                } else if(!result.hasMorePages) {
                    setTimeout(function() {
                        me.consumeTransactionMessages(authenticationToken, backChainURL); /*Don't pass callback, because result already sent to client*/
                    }, config.readFileTimeInMillis);
                }

                if(typeof callback !== 'undefined') {
                    callback(null, {syncDone : true, authenticationToken: authenticationToken, backChainURL: backChainURL, lastSyncTimeInMillis: lastSyncTimeInMillis});
                }
            }
        });
    }

    insertOrUpdateSettings(authenticationToken, backChainURL) {
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
                    "backChainURL": backChainURL
                }
                writeValue = settingsCollection;
            } else {
                writeValue = {
                    "type" : "applicationSettings",
                    chainOfCustidy: {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis": lastSyncTimeInMillis,
                        "backChainURL": backChainURL
                    }
                }
            };

            dbconnectionManager.getConnection().collection("Settings").updateOne({type: 'applicationSettings'}, writeValue, { upsert: true }, function(err, res) {
                if (err) throw err;
                else if(res) console.log('Setting time updated successfully!');
            });
        });

        return lastSyncTimeInMillis;
    }

    insertMessages(transMessages) {
        for (let i = 0; i < transMessages.length; i++) {
            let document = transMessages[i];
            dbconnectionManager.getConnection().collection('Transactions').update({
                    "id": document.id
                },
                 document , {
                    upsert: true
                }
            )
        }
    }
}

export const receiveTransactionsTask = new ReceiveTransactionsTask();