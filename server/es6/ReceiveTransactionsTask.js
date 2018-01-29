import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';
import {settingsHelper} from './SettingsHelper';
import {backChainUtil} from  './BackChainUtil';
import { blockChainVerifier } from './BlockChainVerifier';
import { syncTransactionTaskHelper } from './SyncTransactionTaskHelper';
import { transactionHelper } from './TransactionHelper';

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
        }).then(response => {
            return response.json();
        }).then(result => {
            if(result && result.transactionMessages) {
                console.log("Received " + result.transactionMessages.length + " messages");
            }
            callback(null, result);
        }).catch(err => {
            callback(err, null);
        });
    }

    consumeTransactionMessages(authenticationToken, chainOfCustodyUrl, callback) {
        this.callGetMessages(authenticationToken, chainOfCustodyUrl, (error, result) => {
            if(error) {
                console.log(error);
                if(typeof callback !== 'undefined') {
                    callback(error, {syncDone : false});
                }
            } else {
                if(result.transactionMessages.length == 0) {
                    //Skip
                    if(typeof callback !== 'undefined') {
                        callback(null, {syncDone : true, authenticationToken: authenticationToken, chainOfCustodyUrl: chainOfCustodyUrl, lastSyncTimeInMillis: new Date().getTime()});
                    }
                } else {
                    let hasMorePages = result.hasMorePages || false;
                    this.insertMessages(result.transactionMessages);
                    let lastSyncTimeInMillis = this.insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl);

                    if(hasMorePages) {
                        this.consumeTransactionMessages(authenticationToken, chainOfCustodyUrl);
                    }
                    if(typeof callback !== 'undefined') {
                        callback(null, {syncDone : true, authenticationToken: authenticationToken, chainOfCustodyUrl: chainOfCustodyUrl, lastSyncTimeInMillis: lastSyncTimeInMillis});
                    }
                }
            }
        });
    }

    startTimer() {
        settingsHelper.getApplicationSettings()
        .then(result => {
            if(typeof result != 'undefined' && typeof result.chainOfCustidy != 'undefined' &&
            typeof result.chainOfCustidy.authenticationToken != 'undefined' && typeof result.chainOfCustidy.chainOfCustodyUrl != 'undefined') {
                console.info('Chain of Custody data will be synced every ' + config.syncDataIntervalInMillis + ' milliseconds');
                setInterval(() => {
                    this.consumeTransactionMessages(result.chainOfCustidy.authenticationToken, result.chainOfCustidy.chainOfCustodyUrl);
                }, config.syncDataIntervalInMillis);
            }
        })
        .catch(err => {
            console.error("Application Settings can't be read: " + err);
        });
    }

    insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl) {
        let lastSyncTimeInMillis = new Date().getTime();
        let settingsCollection = null;

        /* finding settingsCollection, because there could be "blockChain" related setup already present */
        dbconnectionManager.getConnection().collection("Settings").findOne({
            type: 'applicationSettings'
        }, (err, result) => {
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

            dbconnectionManager.getConnection().collection("Settings").updateOne({
                type: 'applicationSettings'
            }, {
                $set: writeValue
            }, {
                upsert: true
            }, (err, res) => {
                if (err) {
                    console.error(err);
                }
                else if(res) {
                    if(startTheTimer) {
                        this.startTimer();
                    }
                    console.log('Setting time updated successfully!');
                }
            });
        });

        return lastSyncTimeInMillis;
    }

    insertMessages(transMessages) {
        settingsHelper.getSyncStatistics()
            .then((syncStatistics) => {
                syncStatistics = syncStatistics || {
                    "earliestSyncDateInMillis": null,
                    "earliestSyncSequenceNo": null,
                    "latestSyncDateInMillis": null,
                    "latestSyncSequenceNo": null,
                    "gaps": []
                };

                let initialIdx = 0;
                let condition = idx => {
                    return idx < transMessages.length;
                };
                let action = idx => {
                    return this.insertMessage(transMessages[idx], syncStatistics)
                        .then(() => ++idx);
                }

                return backChainUtil.promiseFor(condition, action, initialIdx);
            })
            .catch((err) => {
                console.error("Error occurred: " + err);
                callback(err, null);
            });

    }

    insertMessage(transMessage, syncStatistics) {
        return dbconnectionManager.getConnection().collection('Transactions').findOne({
            "id": transMessage.id
        }).then(result => {
            let transactionInDb = result || {
                id: transMessage.id,
                date: transMessage.date,
                transactionSlices: [],

                // Hashes received from Platform
                transactionSliceHashes: [],

                // Hashes generated by BCV from the serialized slice
                trueTransactionSliceHashes: [],

                // Extra information that is useful to have in the DB rather
                // than in the GridStore.
                eventCount: 0,
                executingUsers: [],
            };

            if(transactionInDb.transactionSliceHashes.indexOf(transMessage.transactionSliceHash) >= 0) {
                return;
            }

            // This message is new, so update db and stats.
            settingsHelper.modifySyncStatsObject(syncStatistics, transMessage);
            settingsHelper.updateSyncStatistics(syncStatistics);

            let transactionSliceObj = JSON.parse(transMessage.transactionSliceString);
            if(transactionSliceObj.type == 'Enterprise') {
                transactionInDb.eventCount = transactionHelper.getEventCount(transactionSliceObj);
            }
            transactionInDb.executingUsers = transactionHelper.addExecutingUsers(transactionInDb.executingUsers, transactionSliceObj);

            // Save the slice in the GridStore.
            return dbconnectionManager.saveSlice(transMessage.transactionSliceString).then(payloadId => {
                let sliceInDb = {};
                sliceInDb.payloadId = payloadId;
                sliceInDb.sequence = transMessage.sequence;
                sliceInDb.type = transactionSliceObj.type;
                sliceInDb.enterprise = transactionSliceObj.enterprise;
                sliceInDb.enterprises = transactionSliceObj.enterprises;
                sliceInDb.businessTransactionIds = this.getBusinessTransactionIds(transactionSliceObj);

                transactionInDb.transactionSlices.push(sliceInDb);
                transactionInDb.transactionSliceHashes.push(transMessage.transactionSliceHash);
                let trueSliceHash = blockChainVerifier.generateHash(transMessage.transactionSliceString);
                transactionInDb.trueTransactionSliceHashes.push(trueSliceHash);

                return transactionInDb;
            });
        })
        .then(transactionInDb => {
            if(!transactionInDb) {
                return;
            }

            return dbconnectionManager.getConnection().collection('Transactions').update(
                {
                    "id": transactionInDb.id
                },
                transactionInDb, {
                    upsert: true
                });
        })
        .catch((err) => {
            console.error("Error occurred while fetching transaction by tnxId [" + transMessage.id + "]: " + err);
        });
    }

    getBusinessTransactionIds(obj) {
        var businessTransactionIds = [];
        for(let i = 0; i < obj.businessTransactions.length; i++) {
            businessTransactionIds.push(obj.businessTransactions[i].btid);
        }
        return businessTransactionIds;
    }

    

}

export const receiveTransactionsTask = new ReceiveTransactionsTask();
