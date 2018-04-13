import { dbconnectionManager } from './DBConnectionManager';
import { transactionHelper } from './TransactionHelper';
import { settingsHelper } from './SettingsHelper';
import { blockChainVerifier } from './BlockChainVerifier';
import { observable } from 'mobx';
import { Long } from 'mongodb';
import crypto from 'crypto';
import moment from 'moment'

class DisputeHelper {

    constructor() { }

    getDisputes(filters) {
        //filters will be an object including all the selected filters in the UI, like transactionId,raisedBy etc.
        //Draft records will come from the db and Open/Closed ones will be fetched using oneBcClient apis
        return new Promise((resolve, reject) => {
            let query = {};
            if (filters) {
                if (filters.status) {
                    query.status = { $in: JSON.parse(filters.status) };
                }
                if (filters.searchTnxId) {
                    query.transactionId = filters.searchTnxId;
                }
            }
            dbconnectionManager.getConnection().collection('DraftDisputes').find(query)
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
                            var prms = new Promise(function (resolve, reject) {
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
                    resolve({ success: true, exists: false});
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
                    /*TODO@PANKAJ [get @observable raisedBy = ""; logic back bcoz it's not worthful to fetch it if it exists in store] 
                    do it after clearify mappingFound related logic from Yusuf
                    */
                    me.getRaisedByAddress(dispute.raisedByName)
                    .then(function(response){
                        if(response.success) {
                            dispute.raisedBy = response.raisedByAddress;
                            me.insertDraft(dispute)
                            .then(function(response){
                                if(response.success) {
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

    generateDisputeId(plainText) {
        return({success: true, generatedDisputeId : crypto.createHash('sha256').update(plainText).digest('hex')});
    }

    discardDraftDispute(disputeId) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').deleteOne({id:disputeId})
            .then((result) => {
                resolve({success: true});
            })
            .catch((err) => {
                console.error("Error occurred while discarding dispute as draft: " + err);
                reject(err);
            });
        });
    }

    submitDispute(dispute) {
        let me = this;
        return new Promise((resolve, reject) => {
            settingsHelper.getApplicationSettings()
            .then(result => {
                if(result && result.blockChain.disputeSubmissionWindowInMinutes) {
                    let disputeSubmissionWindowInMinutes = result.blockChain.disputeSubmissionWindowInMinutes;
                    transactionHelper.getTransactionById(dispute.transactionId, (err, transaction) => {
                        if (transaction) {
                            let duration = moment.duration(moment(new Date()).diff(moment(new Date(transaction.date))));
                            let mins = Math.ceil(duration.asMinutes());
                            if(mins < disputeSubmissionWindowInMinutes) {
                                /*TODO send dispute to Block chain and on success call this.discardDraftDispute(dispute.id)*/
                                resolve({success:true, submitDisputeMsg: 'submitted dispute'});
                            } else {
                                eject({success:true, submitDisputeMsg: 'Time window to raise a dispute on this transaction has already passed.'});
                            }
                        }
                    });
                }
            })
            .catch(err => {
                console.error("Application Settings can't be read in submitDispute: " + err);
                reject(err);
            });
        });
    }

    closeDispute(disputeId) {
        return new Promise((resolve, reject) => {
            // write code to close dispute
        });
    }

    getRaisedByAddress(raisedByName) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('BackChainAddressMapping').find()
                .toArray(function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        result = result[0];
                        let mappingFound = false;
                        for (let key in result) {
                            if (result.hasOwnProperty(key)) {
                              if(result[key] == raisedByName) {
                                mappingFound = true;
                                resolve({success : true, raisedByAddress : key});
                                break;
                              }
                            }
                        }
                        if(!mappingFound) {
                            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' })
                            .then(function (result) {
                                if (result) {
                                    resolve({success : true, raisedByAddress : result.blockChain.disputeContractAddress})
                                } else {
                                    reject("Couldn't fetch the value");
                                }
                            });
                        }
                    }
                });
        });
    }
}

export const disputeHelper = new DisputeHelper();