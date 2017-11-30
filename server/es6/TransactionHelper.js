import {dbconnectionManager} from './DBConnectionManager';
import {blockChainVerifier} from './BlockChainVerifier';
import { observable} from 'mobx';

class TransactionHelper {

    constructor() {}

    getTransactionById(transId, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').findOne({
                "id": transId
            }).then((result) => {
                if (result) {
                    callback(null, result);
                }
                else {
                    callback(null, false);
                }
            })
            .catch((err) => {
                console.error("Error occurred while fetching transaction by tnxId." + err);
                callback(err, null);
            });
    }

    getTransactionByBusineesTransactionId(btId, callback) {
        let result = dbconnectionManager.getConnection().collection('Transactions').find({
            "transactionSliceObjects": {
                $elemMatch: {
                    "businessTransactions": {
                        $elemMatch: {
                            "btid": {$in : btId} 
                        }
                    }
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

    /**
     * returns a map(Actual Map object) of
     * <transaction.id>_<ent_name> : <stringified version of the slice>
     * @param {*} transactions - list of slice objects which include my ent view and all others (full payload)
     * @param {*} myEntName - name of the logged enterprise
     */
    extractSlicesToVerify(transactions, myEntName) {
        let verificationPairs = new Map();
        transactions.forEach(transaction => {
            if (transaction) {
                for (let j = 0; j < transaction.transactionSliceObjects.length; j++) {
                    let tnxSliceObj = transaction.transactionSliceObjects[j];
                    let tnxSliceStringified = transaction.transactionSlices[j];

                    if (tnxSliceObj.type == "Enterprise" && tnxSliceObj.enterprise == myEntName) {
                        verificationPairs.set(transaction.id + "_" + myEntName, tnxSliceStringified);
                    }

                    if (tnxSliceObj.type == "Intersection" && ((tnxSliceObj.enterprises).indexOf(myEntName) > -1)) {
                        let logInUserEntIndex = (tnxSliceObj.enterprises).indexOf(myEntName);
                        let partnerEntName = logInUserEntIndex == 0 ? tnxSliceObj.enterprises[1] : tnxSliceObj.enterprises[0];
                        verificationPairs.set(transaction.id + "_" + partnerEntName, tnxSliceStringified);
                    }
                }
            }
        });
        return verificationPairs;
    }

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
        let transactionSliceObjects = transaction.transactionSliceObjects;
        let sliceIndex = null;
        for (let index = 0; index < transactionSliceObjects.length; index++) {
            if (transactionSliceObjects[index].type == "Enterprise" &&
                tranSliceObj.type == transactionSliceObjects[index].type) {
                sliceIndex = index;
                break;
            } else if (transactionSliceObjects[index].type == "Intersection" &&
                (transactionSliceObjects[index].enterprises.indexOf(tranSliceObj.enterprises[0]) > -1 &&
                    transactionSliceObjects[index].enterprises.indexOf(tranSliceObj.enterprises[1]) > -1)) {
                sliceIndex = index;
                break;
            }
        }
        return sliceIndex;
    }

    storeVerificationData(transactions, entNameOfLoggedUser, oneBcClient){
        let verifications = observable.map({});
        let verificationPairs = this.extractSlicesToVerify(transactions,entNameOfLoggedUser);
        verificationPairs.forEach((stringifiedSlice, key) => {
            verifications.set(key, undefined);
            blockChainVerifier.verifyBlockChain(blockChainVerifier.generateHash(stringifiedSlice), oneBcClient)
            .then(function (result) {
                verifications.set(key, result === true ? 'verified' : 'failed');
            })
            .catch(function (error) {
                verifications.set(key, 'failed');
            });
        });
        return verifications;
    }
}

export const transactionHelper = new TransactionHelper();