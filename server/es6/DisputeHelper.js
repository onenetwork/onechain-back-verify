import { dbconnectionManager } from './DBConnectionManager';
import { transactionHelper } from './TransactionHelper';
import { blockChainVerifier } from './BlockChainVerifier';
import { observable } from 'mobx';
import { Long } from 'mongodb';

class DisputeHelper {

    constructor() { }

    getDisputes(filters) {
        //filters will be an object including all the selected filters in the UI, like transactionId,raisedBy etc.
        //Draft records will come from the db and Open/Closed ones will be fetched using oneBcClient apis
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').find()
                .sort({ creationDate: -1 })
                .toArray(function (err, result) {
                    if (err) {
                        console.error("Error occurred while fetching transations by sequencenos." + err);
                        reject(err);
                    } else {
                        var promisesToWaitOn = [];
                        for (var i = 0; i < result.length; i++) {
                            let dispute = result[i];
                            //Fetch transaction data if exists
                            var prms = new Promise(function(resolve, reject) {
                                transactionHelper.getTransactionById(dispute.transactionId, (err, transaction) => {
                                    if (transaction) {
                                        dispute.transaction = transaction; //Transaction is in the database.
                                    }
                                    resolve(dispute);
                                });
                            });
                            promisesToWaitOn.push(prms);
                        }
                        Promise.all(promisesToWaitOn).then(function (disputes) {
                            resolve(disputes);
                        });
                    }
                });
        });
    }

    getOpenDisputeCount(transactionId) {
        /**
         * Remove the callback function. Use a promise object instead
         * iff transactionId is null, this should fetch records from:
         *   - getDraftCount() => DraftDisputes count
         *   - onechain-back-client will have an api for this. For now you can skip this one
         * iff transactionId is given, this should fetch records from:
         *   - getDraftCount(transactionId) => DraftDisputes filtered by transactionId
         *   - onechain-back-client's api will have an option to filter by transactionId. We'll add this later.
         * resolve or reject depending on the result
         */
        return new Promise((resolve, reject) => {
            if (transactionId == null) {
                this.getDraftCount()
                    .then((count) => {
                        resolve(count);
                    })
                    .catch((err) => {
                        console.error("Error occurred while fetching open dispute count." + err);
                        reject(err);
                    });
            } else {
                this.getDraftCount(transactionId)
                    .then((count) => {
                        resolve(count);
                    })
                    .catch((err) => {
                        console.error("Error occurred while fetching open dispute count." + err);
                        reject(err);
                    });
            }
        });
    }

    getDraftCount(transactionId) {
        /**
         * Should return a promise
         * iff transactionId is null, fetch the total count of DraftDisputes collections
         * iff transactionId is given, fetch the total count of DraftDisputes per transaction from the collection.
         * resolve or reject depending on the result
         */
        return new Promise((resolve, reject) => {
            if (transactionId == null) {
                dbconnectionManager.getConnection().collection('DraftDisputes').count()
                    .then((count) => {
                        resolve(count);
                    })
                    .catch((err) => {
                        console.error("Error occurred while fetching draft count." + err);
                        reject(err);
                    });
            } else {
                dbconnectionManager.getConnection().collection('DraftDisputes').find({ "transactionId": transactionId }).count()
                    .then((count) => {
                        resolve(count);
                    })
                    .catch((err) => {
                        console.error("Error occurred while fetching draft count." + err);
                        reject(err);
                    });
            }
        });
    }

    disputeExists(transactionId) {
        // TODO check if dispute exists in blockchain
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').findOne({ "transactionId": transactionId })
            .then((result) => {
                if(result) {
                    resolve({success:true, exists:true, status:result.status});
                } else {
                    resolve({success:true});
                }
            })
            .catch((err) => {
                console.error("Error occurred while fetching DraftDisputes" + err);
                reject(err);
            });
        });
    }

    saveAsDraft(dispute) {
        var me = this;
        return new Promise((resolve, reject) => {
            this.disputeExists(dispute.transactionId)
            .then(function(response) {
                if(response.exists) {
                    resolve(response);
                } else {
                    if(dispute.raisedBy) {
                        me.insertDraft(dispute)
                        .then(function(response){
                            if(response.success) {
                                resolve(response);
                            }
                        }, function(error){
                            console.error(error);
                            reject(error);
                        });
                    } else {
                        transactionHelper.getRaisedByAddress(dispute.entNameOfLoggedUser)
                        .then(function(response){
                            if(response.success) {
                                dispute.raisedBy = response.entAddress;
                                me.insertDraft(dispute)
                                .then(function(response){
                                    if(response.success) {
                                        response.raisedBy = dispute.raisedBy;
                                        resolve(response);
                                    }
                                }, function(error){
                                    console.error(error);
                                    reject(error);
                                });
                            }
                        }, function(error){
                            console.error(error);
                            reject(error);
                        });
                    }
                }
            }, function(error) {
                console.error(error);
                reject(error);
            });
        });
    }

    insertDraft(dispute) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').insert(dispute)
            .then(() => {
                resolve({success: true});
            })
            .catch((err) => {
                console.error("Error occurred while saving dispute as draft: " + err);
                reject(err);
            });
        });
    }
}

export const disputeHelper = new DisputeHelper();