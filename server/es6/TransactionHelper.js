import {dbconnectionManager} from './DBConnectionManager';
import {blockChainVerifier} from './BlockChainVerifier';
import { observable} from 'mobx';
import {Long} from 'mongodb';

class TransactionHelper {

    constructor() {}

    getTransactionById(transId, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').findOne({
                "id": transId
            }).then((result) => {
                callback(null, result);
            })
            .catch((err) => {
                console.error("Error occurred while fetching transaction by tnxId." + err);
                callback(err, null);
            });
    }

    getTransactionByBusinessTransactionId(btId, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').find({
            "transactionSlices": {
                $elemMatch: {
                    "businessTransactionIds": {$in : btId}
                }
            }
        }).sort({date:-1}).toArray(function(err, result) {
            if (err) {
                console.error("Error occurred while fetching transaction by btId." + err);
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
    }
    /*
    Currently unused:

    getTransactionByText(searchText, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').find({
        $text: {$search: searchText}},{score: {$meta: "textScore"}})
            .sort({score:{$meta:"textScore"}
           }).toArray(function(err, result) {
            if (err) {
                console.error("Error occurred while fetching transations by text." + err);
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
    }

    getTransactionByIds(transIds, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').find({
             "id": { $in: transIds},
            }).toArray(function(err, result) {
                if (err) {
                    console.error("Error occurred while fetching transaction by getTransactionByIds." + err);
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
    }
    */

    saveBlockChainSettings(config, callback) {
    // check if there is any saved value
        dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, exist) {
            if (err) {
                logger.error(err);
                callback(err, false);
            }

            if (exist && exist.blockChain) {
                callback(null, true);
            } else {
                //make sure the inserted values are not null
                // if (config.constructor !== Object) {
                //     callback(null, false);
                // }
                // if (Object.keys(config).length === 0) {
                //     callback(null, false);
                // }
                let data = '';
                if(exist && exist.chainOfCustidy) {
                    exist.blockChain= {
                        'url': config.url,
                        'contractAddress': config.contractAddress,
                        'privateKey': config.privatekey
                    }
                    data = exist;
                } else {
                    data = {
                        type: 'applicationSettings',
                        blockChain: {
                            'url': config.url,
                            'contractAddress': config.contractAddress,
                            'privateKey': config.privatekey
                        }

                    };
                }

                var result = dbconnectionManager.getConnection().collection('Settings').update({ type: 'applicationSettings' }, data, { upsert: true }).then(function (result) {
                    if (result) {
                        callback(null, true);
                    }
                }).catch(function (err) {
                    console.error("Error occurred while saving configuration to database." + err);
                    callback(err, false);
                });
            }
        });
    }

    findSliceInTransaction(transaction, transactionSlice,callback) {
        let tranSliceObj = JSON.parse(transactionSlice);
        let sliceIndex = -1;
        if(transaction == null) {
            return sliceIndex;
        }
        let transactionSlices = transaction.transactionSlices;
        for (let index = 0; index < transactionSlices.length; index++) {
            if (transactionSlices[index].type == "Enterprise" &&
                tranSliceObj.type == transactionSlices[index].type) {
                sliceIndex = index;
                break;
            } else if (transactionSlices[index].type == "Intersection" &&
                (transactionSlices[index].enterprises.indexOf(tranSliceObj.enterprises[0]) > -1 &&
                transactionSlices[index].enterprises.indexOf(tranSliceObj.enterprises[1]) > -1)) {
                sliceIndex = index;
                break;
            }
        }
        return sliceIndex;
    }

    generateVerificationDataAndStartVerifying(transactions, store) {
        store.verifications.clear();
        if(transactions.length == 0) {
            return;
        }
        store.canStartVerifying = false;
        const myEntName = store.entNameOfLoggedUser;
        const oneBcClient = store.oneBcClient;

        transactions.forEach(transaction => {
            if (!transaction) {
                return;
            }

            for (let i = 0; i < transaction.transactionSlices.length; i++) {
                let sliceObj = transaction.transactionSlices[i];
                let sliceHash = transaction.transactionSliceHashes[i];
                let trueSliceHash = transaction.trueTransactionSliceHashes[i];

                let key;
                if (sliceObj.type == "Enterprise") {
                    key = transaction.id + "_" + sliceObj.enterprise;
                }
                else if (sliceObj.type == "Intersection") {
                    let myEntIndex = sliceObj.enterprises.indexOf(myEntName);
                    let partnerEntName = '';
                    if(myEntIndex > -1) {
                        partnerEntName = myEntIndex == 0 ? sliceObj.enterprises[1] : sliceObj.enterprises[0];
                    } else {
                        partnerEntName = sliceObj.enterprises[0] + ' & ' +  sliceObj.enterprises[1];
                    }
                    key = transaction.id + "_" + partnerEntName; 
                }

                if(!key) {
                    continue;
                }
                if(sliceHash === trueSliceHash) {
                    if(oneBcClient) {
                        store.verifications.set(key, 'verifying');
                        (function(verificationKey, hash) {
                            blockChainVerifier.verifyHash(hash, oneBcClient)
                                .then(function (result) {
                                    store.verifications.set(verificationKey, result === true ? 'verified' : 'failed');
                                })
                                .catch(function (error) {
                                    store.verifications.set(verificationKey, 'failed');
                                });
                        })(key, sliceHash);
                    }
                    else if(store.sliceDataProvidedByAPI) {
                        store.verifications.set(key, 'verified');
                    }
                    else {
                        store.verifications.set(key, 'failed');
                    }
                }
                else {
                    store.verifications.set(key, 'failed');
                }

            }
        });
        store.canStartVerifying = true;
    }

    getTransactionsBySequenceNos(sequenceNos) {
        for(let i = 0; i < sequenceNos.length; i++) {
            if(Number.isSafeInteger(Number(sequenceNos[i]))) {
                sequenceNos[i] = parseInt(sequenceNos[i]);
            } else {
                sequenceNos[i] = Long.fromString(sequenceNos[i]);
            }
        }
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('Transactions').find({
                    "transactions.transactionSlices.sequence": {
                        $in: sequenceNos
                    }
            })
            .sort({ "sequence": 1 })
            .toArray(function(err, result) {
                if (err) {
                    console.error("Error occurred while fetching transations by sequencenos." + err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    getEventCount(transactionSliceObj) {
        return transactionSliceObj.businessTransactions.length;
    }

    addExecutingUsers(existingExecutingUsers, transactionSliceObj) {
        let executingUsers = new Set(existingExecutingUsers);
        for(let i = 0; i < transactionSliceObj.businessTransactions.length; i++) {
            executingUsers.add(transactionSliceObj.businessTransactions[i].LastModifiedUser);
        }
        return Array.from(executingUsers);
    }

    getEventsForTransaction(transId) {
        return new Promise(resolve => {
            transactionHelper.getTransactionById(transId, (err, transaction) => {
                if(transaction) {
                    for(let i = 0; i < transaction.transactionSlices.length; i++) {
                        let transactionSlice = transaction.transactionSlices[i];
                        if(transactionSlice.type == 'Enterprise') {
                            dbconnectionManager.fetchSlice(transactionSlice.payloadId)
                                .then(serializedSlice => {
                                    let slice = JSON.parse(serializedSlice);
                                    let events = [];
                                    for(let j = 0; j < slice.businessTransactions.length; j++) {
                                        let bt = slice.businessTransactions[j];
                                        events.push({
                                            date: bt.LastModifiedDate.date,
                                            actionName: bt.ActionName.split('.')[1]
                                        });
                                    }

                                    resolve(events);
                                });
                            return;
                        }
                    }
                }

                resolve([]);
            });
        });
    }
}

export const transactionHelper = new TransactionHelper();
