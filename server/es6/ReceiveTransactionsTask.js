import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';

class ReceiveTransactionsTask {
    constructor() {}

    /**
     * - Backchain app goes in a loop doing this:
  1 call https://platform/oms/rest/backchain/v1/consume?limitInKb=1024
  2 whatever transaction messages are returned, write to mongo
  3 if hasMorePages=true in return result, go back to step 1
  4 if not ... sleep for N minutes (maybe 5 minutes), go back to step 1


  Call get messages should be smart enough to keep going when hasMorePages comes back as true. We will use size limit of 2014
     */
    callGetMessages(authenticationToken, backChainURL) {
        return new Promise((resolve, reject) => {
            let lastSyncTimeInMillis = new Date().getTime();
            let settingsCollection = null;

            // find last updated time in DB
            dbconnectionManager.getConnection().collection("Settings").findOne({type: 'applicationSettings'}, function(err, result) {
                if (err) throw err;
                if (result) {
                    settingsCollection = result;
                    if(result.chainOfCustidy) {
                        lastSyncTimeInMillis = result.chainOfCustidy.lastSyncTimeInMillis;
                    }
                }

                let msgArr = JSON.parse(transactionConsumer.getMessages(lastSyncTimeInMillis));
                // put transactionSliceObjects json into msgArr json
                let transactionSliceObjArr = [];
                for (let i = 0; i < msgArr.length; i++) {
                    msgArr[i].transactionSliceObjects = [];
                    for (let j = 0; j < msgArr[i]['transactionSlices'].length; j++) {
                        msgArr[i].transactionSliceObjects.push(JSON.parse(msgArr[i]['transactionSlices'][j]));
                    }
                }

                var writeValue = null;
                if(settingsCollection) {
                    settingsCollection.chainOfCustidy = {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis": lastSyncTimeInMillis,
                        "backChainURL": backChainURL
                    }
                    writeValue = settingsCollection;
                } else {
                    writeValue = { "type" : "applicationSettings",
                        chainOfCustidy: {
                            "authenticationToken" : authenticationToken,
                            "lastSyncTimeInMillis": lastSyncTimeInMillis,
                            "backChainURL": backChainURL
                        }
                    }
                };

                //IMPORTANT Don't have a separate collection. Modify chainOfCustody.lastSyncTimeInMillis value instead. Create a helper method
                dbconnectionManager.getConnection().collection("Settings").updateOne({type: 'applicationSettings'}, writeValue, { upsert: true }, function(err, res) {
                    if (err) throw err;
                    if(msgArr.length > 0) {
                        resolve({messages : msgArr, lastSyncTimeInMillis: lastSyncTimeInMillis, hasMorePages : Math.random() >= 0.5});
                    } else {
                        reject();
                    }
                });
                return msgArr;
            });
        });
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

    consumeTransactionMessages(authenticationToken, backChainURL, callback) {
        let me = this;
        receiveTransactionsTask.callGetMessages(authenticationToken, backChainURL).then(function(response) {
            return response;
        }).then(function(result) {
            console.log('hasMorePages: ' + result.hasMorePages);
            me.insertMessages(result.messages);
            if(result.hasMorePages) {
                me.consumeTransactionMessages(authenticationToken, backChainURL);
            } 
            else if(!result.hasMorePages) {
                setTimeout(function() {
                    me.consumeTransactionMessages(authenticationToken, backChainURL); /*Don't pass callback, because result already sent to client*/
                }, config.readFileTimeInMillis);
            }
            if(typeof callback !== 'undefined') {
                callback(null, {syncDone : true, authenticationToken: authenticationToken, backChainURL: backChainURL, lastSyncTimeInMillis: result.lastSyncTimeInMillis});
            }
        }).catch(function (error) {
            console.log(error);
            if(typeof callback !== 'undefined') {
                callback(error, {syncDone : false});
            }
        });
    }
}

export const receiveTransactionsTask = new ReceiveTransactionsTask();