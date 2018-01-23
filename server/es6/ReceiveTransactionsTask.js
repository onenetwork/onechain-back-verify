import config from './config';
import {transactionConsumer} from './TransactionConsumer';
import {dbconnectionManager} from './DBConnectionManager';
import {settingsHelper} from './SettingsHelper';
import {backChainUtil} from  './BackChainUtil';
import { blockChainVerifier } from './BlockChainVerifier';

class ReceiveTransactionsTask {
    constructor() {

    }

    callGetMessages(authenticationToken, chainOfCustodyUrl, callback) {
        let result = {
            "success":true,
            "hasMorePages":false,
            "transactionMessages":[
               {
                  "date":1516724694000,
                  "sequence":1,
                  "transactionSliceHash":"9d964e86f14cfcaec65818c76e1d755bba9581506b2e60cbd9ec86b6b4e99984",
                  "transactionSliceString":"{\"businessTransactions\":[{\"LastModifiedDate\":{\"date\":\"2018-01-23T16:24:53\",\"tzId\":\"America/New_York\",\"tzCode\":\"EST\"},\"btid\":\"b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6\",\"ModelLevelType\":\"PTA.TestModel\",\"PtxVersion\":1,\"btref\":\"http://sdurkin:80/oms~PTA.TestModel~aaaabbbb~100\",\"ValueChainId\":100,\"TestModelKey\":\"aaaabbbb\",\"ActionName\":\"PTA.CreateTestModel\",\"Active\":true,\"LastModifiedUser\":\"ScottRepAnalyst\"}],\"enterprise\":\"ProgressiveRetailer\",\"type\":\"Enterprise\"}",
                  "id":"a15e27c51be1ec0b1bbcebcea3578b9dd3bd131f54cf66262a046a15c264b096",
                  "type": "Enterprise",
                  "enterprise": "ProgressiveRetailer",
                  "businessTransactionIds": ["b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6"]
               },
               {
                  "date":1516724694000,
                  "sequence":2,
                  "transactionSliceHash":"e54bc1e0e28b4232ec8c1ac8a512461793f8470d65084bd2164896785f073c81",
                  "transactionSliceString":"{\"businessTransactions\":[{\"LastModifiedDate\":{\"date\":\"2018-01-23T16:24:53\",\"tzId\":\"America/New_York\",\"tzCode\":\"EST\"},\"btid\":\"b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6\",\"ModelLevelType\":\"PTA.TestModel\",\"PtxVersion\":1,\"btref\":\"http://sdurkin:80/oms~PTA.TestModel~aaaabbbb~100\",\"ValueChainId\":100,\"TestModelKey\":\"aaaabbbb\",\"ActionName\":\"PTA.CreateTestModel\",\"Active\":true,\"LastModifiedUser\":\"ScottRepAnalyst\"}],\"type\":\"Intersection\",\"enterprises\":[\"Carrier A\",\"ProgressiveRetailer\"]}",
                  "id":"a15e27c51be1ec0b1bbcebcea3578b9dd3bd131f54cf66262a046a15c264b096",
                  "type": "Intersection",
                  "enterprises": [ "ProgressiveRetailer", "CarrierA" ],
                  "businessTransactionIds": ["b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6"]
               },
               {
                "date":1516724694000,
                "sequence":3,
                "transactionSliceHash":"e54bc1e0e28b4232ec8c1ac8a512461793f8470d65084bd2164896785f073c81",
                "transactionSliceString":"{\"businessTransactions\":[{\"LastModifiedDate\":{\"date\":\"2018-01-23T16:24:53\",\"tzId\":\"America/New_York\",\"tzCode\":\"EST\"},\"btid\":\"b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6\",\"ModelLevelType\":\"PTA.TestModel\",\"PtxVersion\":1,\"btref\":\"http://sdurkin:80/oms~PTA.TestModel~aaaabbbb~100\",\"ValueChainId\":100,\"TestModelKey\":\"aaaabbbb\",\"ActionName\":\"PTA.CreateTestModel\",\"Active\":false,\"LastModifiedUser\":\"ScottRepAnalyst\"}],\"type\":\"Enterprise\",\"enterprise\":\"ProgressiveRetailer\"]}",
                "id":"a15e27c51be1ec0b1bbcebcea3578b9dd3bd131f54cf66262a046a15c264b096",
                "type": "Enterprise",
                "enterprise": "ProgressiveRetailer",
                "businessTransactionIds": ["b912abcd3885fee4d16356665ddea6a665bf6bedd05a06d6c2c4b193c4d837c6"]
             }
           ]
         };
        if(result && result.transactionMessages) {
            console.log("Received " + result.transactionMessages.length + " messages");
        }
        callback(null, result);
        /*
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
            if(result && result.transactionMessages) {
                console.log("Received " + result.transactionMessages.length + " messages");
            }
            callback(null, result);
        }).catch(function (err) {
            callback(err, null);
        });
        */
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
                if(result.transactionMessages.length == 0) {
                    //Skip
                    if(typeof callback !== 'undefined') {
                        callback(null, {syncDone : true, authenticationToken: authenticationToken, chainOfCustodyUrl: chainOfCustodyUrl, lastSyncTimeInMillis: new Date().getTime()});
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
        const me = this;

        // To prevent race conditions, maintain an in-memory object. If db
        // returns null, we should look at in-memory object to prevent override of db.
        const inMemoryTnx = {};

        settingsHelper.getSyncStatistics()
            .then((syncStatistics) => {
                syncStatistics = syncStatistics || {
                    "earliestSyncDateInMillis": null,
                    "earliestSyncSequenceNo": null,
                    "latestSyncDateInMillis": null,
                    "latestSyncSequenceNo": null,
                    "gaps": []
                };

                for (let i = 0; i < transMessages.length; i++) {
                    me.insertMessage(transMessages[i], inMemoryTnx, syncStatistics);
                }
            })
            .catch((err) => {
                console.error("Error occurred while fetching transaction by tnxId [" + transMessage.id + "]" + err);
                callback(err, null);
            });

    }

    insertMessage(transMessage, inMemoryTnx, syncStatistics) {
        const me = this;
        dbconnectionManager.getConnection().collection('Transactions').findOne({
            "id": transMessage.id
        }).then((result) => {
            let transactionInDb = result || inMemoryTnx[transMessage.id] || {
                id: transMessage.id,
                date: transMessage.date,
                transactionSlices: [],

                // Hashes received from Platform
                transactionSliceHashes: [],

                // Hashes generated by BCV from the serialized slice
                trueTransactionSliceHashes: []
            };

            console.log("Received " + transMessage.transactionSliceHash);
            if(transactionInDb.transactionSliceHashes.indexOf(transMessage.transactionSliceHash) >= 0) {
                console.log("Already in DB, skipping");
                return;
            }

            // This message is new, so update db and stats.
            settingsHelper.modifySyncStatsObject(syncStatistics, transMessage);
            settingsHelper.updateSyncStatistics(syncStatistics);

            let sliceInDb = {};
            let transactionSliceObj = JSON.parse(transMessage.transactionSliceString);
            sliceInDb.businessTransactionIds = me.getBusinessTransactionIds(transactionSliceObj);
            sliceInDb.sequence = transMessage.sequence;
            sliceInDb.type = transactionSliceObj.type;
            sliceInDb.enterprise = transactionSliceObj.enterprise;
            sliceInDb.enterprises = transactionSliceObj.enterprises;
            transactionInDb.transactionSlices.push(sliceInDb);

            // TODO: save slice in GridFS, store payloadId in sliceInDb

            transactionInDb.transactionSliceHashes.push(transMessage.transactionSliceHash);
            let trueSliceHash = blockChainVerifier.generateHash(transMessage.transactionSliceString);
            transactionInDb.trueTransactionSliceHashes.push(trueSliceHash);

            inMemoryTnx[transMessage.id] = transactionInDb;

            dbconnectionManager.getConnection().collection('Transactions').update(
                {
                    "id": transactionInDb.id
                },
                transactionInDb, {
                    upsert: true
                });
        })
        .catch((err) => {
            console.error("Error occurred while fetching transaction by tnxId [" + transMessage.id + "]" + err);
            callback(err, null);
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
