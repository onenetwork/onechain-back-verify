import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';
import {settingsHelper} from './SettingsHelper';
import {backChainUtil} from  './BackChainUtil';

class ReceiveTransactionsTask {
    constructor() {

    }

    callGetMessages(authenticationToken, chainOfCustodyUrl, callback) {
        fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/consume?limitInKb=1024'), {
            method: 'get',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'token ' + authenticationToken
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
                }
                if(typeof callback !== 'undefined') {
                    callback(null, {syncDone : true, authenticationToken: authenticationToken, chainOfCustodyUrl: chainOfCustodyUrl, lastSyncTimeInMillis: lastSyncTimeInMillis});
                }
            }
        });
    }

    startTimer() {
        const me = this;
        settingsHelper.getApplicationSettings()
        .then(function(result) {
            if(typeof result != 'undefined' && typeof result.chainOfCustidy != 'undefined' && 
            typeof result.chainOfCustidy.authenticationToken != 'undefined' && typeof result.chainOfCustidy.chainOfCustodyUrl != 'undefined') {
                console.info('Chain of Custody data will be synced every ' + config.syncDataIntervalInMillis + ' milliseconds');
                setInterval(function(){
                    me.consumeTransactionMessages(result.chainOfCustidy.authenticationToken, result.chainOfCustidy.chainOfCustodyUrl);
                }, config.syncDataIntervalInMillis);
            }
        })
        .catch(function (err) {
            console.error("Application Settings can't be read: " + err);
        });  
    }

    insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl) {
        let lastSyncTimeInMillis = new Date().getTime();
        let settingsCollection = null;
        const me = this;
        /* finding settingsCollection, because there could be "blockChain" related setup already present */
        dbconnectionManager.getConnection().collection("Settings").findOne({type: 'applicationSettings'}, function(err, result) {
            if (err) throw err;
            if (result) {
                settingsCollection = result;
            }
            /* If the timer hasn't started yet, it's time to start. Only happens with a new instance*/
            let startTheTimer = typeof settingsCollection.chainOfCustidy == 'undefined' || 
            typeof settingsCollection.chainOfCustidy.chainOfCustodyUrl == 'undefined' || typeof settingsCollection.chainOfCustidy.authenticationToken == 'undefined'; 
            let writeValue = null;
            if(settingsCollection) {
                settingsCollection.chainOfCustidy = {
                    "authenticationToken" : authenticationToken,
                    "lastSyncTimeInMillis": lastSyncTimeInMillis,
                    "chainOfCustodyUrl": chainOfCustodyUrl,
                    "enterpriseName":settingsCollection.chainOfCustidy.enterpriseName
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
                    if(startTheTimer) {
                        me.startTimer();
                    }
                    console.log('Setting time updated successfully!');
                }
            });
        });

        return lastSyncTimeInMillis;
    }

    insertMessages(transMessages) {
        let transactionsById = {};
        for (let i = 0; i < transMessages.length; i++) {
            let transMessage = transMessages[i];
            transactionsById[transMessage.id] = transactionsById[transMessage.id] || {
                id: transMessage.id,
                transactionSlices: [],
                transactionSliceObjects: [],
                transactionSliceHashes: []
            };

            let document = transactionsById[transMessage.id];
            document.transactionSlices.push(transMessage.transactionSliceString);
            document.transactionSliceObjects.push(JSON.parse(transMessage.transactionSliceString));
            document.transactionSliceHashes.push(transMessage.transactionSliceHash);

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