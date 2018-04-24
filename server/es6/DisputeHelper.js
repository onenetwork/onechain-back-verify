import { dbconnectionManager } from './DBConnectionManager';
import { transactionHelper } from './TransactionHelper';
import { settingsHelper } from './SettingsHelper';
import { blockChainVerifier } from './BlockChainVerifier';
import { disputeOrganizerTaskHelper } from './DisputeOrganizerTaskHelper';
import { observable } from 'mobx';
import { Long } from 'mongodb';
import crypto from 'crypto';
import moment from 'moment'

class DisputeHelper {

    constructor() { }

    getDisputes(filters) {
        //filters will be an object including all the selected filters in the UI, like transactionId,raisedBy etc.
        //Draft records will come from the db and Open/Closed ones will be fetched using oneBcClient apis
        let me = this;
        return new Promise((resolve, reject) => {
            if(filters) {
                this.createFilterQuery(filters)
                .then((query) => {
                    if (query.searchInDraftDispute) {
                        delete query.searchInDraftDispute;
                        me.queryDisputes(query, filters)
                            .then((result) => {
                                resolve(result);
                        })
                    }
                })
            } else {
                me.queryDisputes({}, null)
                    .then((result) => {
                        resolve(result);
                    })
            }
        });
    }

    queryDisputes(query, filters) {
        let me = this;
        return new Promise((resolve, reject) => {
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
                                        if (filters && filters.transactionRelatedFilter && JSON.parse(filters.transactionRelatedFilter)) {
                                            dispute = me.applyTransactionRelatedFilters(dispute, transaction, filters);
                                        } else {
                                            dispute.transaction = transaction; //Transaction is in the database.
                                        }
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

    createFilterQuery(filters) {
        let me = this;
        return new Promise((resolve, reject) => {
            var promisesToWaitOn = [];
            let query = {};
            query.searchInDraftDispute = true;
            if (this.isValueNotNull(filters.status)) {
                query.status = { $in: JSON.parse(filters.status) };
            }
            if (this.isValueNotNull(filters.searchTnxId)) {
                query.transactionId = filters.searchTnxId;
            }
            if (this.isValueNotNull(filters.searchDisputeId)) {
                query.id = filters.searchDisputeId;
            }

            if (this.isValueNotNull(filters.disputeSubmitFromDate)) {
                query.submittedDate = { $gte: JSON.parse(filters.disputeSubmitFromDate) };
            }

            if (this.isValueNotNull(filters.disputeSubmitToDate)) {
                query.submittedDate = { $lte: JSON.parse(filters.disputeSubmitToDate) };
            }

            if (this.isValueNotNull(filters.disputeCloseFromDate)) {
                query.closedDate = { $gte: JSON.parse(filters.disputeCloseFromDate) };
            }

            if (this.isValueNotNull(filters.disputeCloseToDate)) {
                query.closedDate = { $lte: JSON.parse(filters.disputeCloseToDate) };
            }

            if (this.isValueNotNull(filters.raisedBy)) {

                if (this.isValueNotNull(filters.metaMaskAddress)) {
                    query.raisedBy = filters.metaMaskAddress;
                }
                else {
                    query.searchInDraftDispute = false;
                    var prms = new Promise(function (resolve, reject) {
                        me.getRaisedByAddress(filters.raisedBy)
                            .then((result) => {
                                if (result) {
                                    query.raisedBy = result.raisedByAddress;
                                    resolve(query);
                                } else {
                                    query.raisedBy = null;
                                    resolve(query);
                                }
                            })
                    });
                    query.raisedBy = filters.raisedBy
                    promisesToWaitOn.push(prms);
                }
            }

            if (this.isValueNotNull(filters.reasonCodes)) {
                query.reasonCode = { $in: JSON.parse(filters.reasonCodes) };
            }

            if (this.isValueNotNull(filters.searchBtId)) {
                query.events = filters.searchBtId;
            }

            Promise.all(promisesToWaitOn).then(function (promise) {
                resolve(query);
            });
        });
    }

    isValueNotNull(value) {
        if (value != null && value != 'null' && value != undefined && value != ''
            && value != '[]' && value != 'undefined' && value != 'NaN') {
            return true;
        }
        return false;
    }

    applyTransactionRelatedFilters(dispute, transaction, filters) {
        if (this.isValueNotNull(filters.tnxFromDate)) {
            if (transaction.date >= JSON.parse(filters.tnxFromDate)) {
                dispute.transaction = transaction;
            } else if (dispute.transactionId == transaction.id) {
                dispute = null;
            }
        }
        if (dispute != null && this.isValueNotNull(filters.tnxToDate)) {
            if (transaction.date <= JSON.parse(filters.tnxToDate)) {
                dispute.transaction = transaction;
            } else if (dispute.transactionId == transaction.id) {
                dispute = null;
            }
        }
        return dispute;
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
            if (!this.isValueNotNull(transactionId)) {
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
            if (!this.isValueNotNull(transactionId)) {
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

    submitDispute(dispute, disputeSubmissionWindowInMinutes) {
        let me = this;
        return new Promise((resolve, reject) => {
            transactionHelper.getTransactionById(dispute.transactionId, (err, transaction) => {
                if (transaction) {
                    me.isSubmitDisputeWindowStillOpen(transaction, disputeSubmissionWindowInMinutes).visible ?
                        resolve({success:true, submitDisputeMsg: 'Dispute Submitted Successfully.'})
                        :
                        resolve({success:false, submitDisputeMsg: "Time window to raise a dispute on this transaction has already passed. You have " + disputeSubmissionWindowInMinutes + " minutes to raise disputes on a transaction."});
                }
            });

        });
    }

    closeDispute(disputeId) {
        return new Promise((resolve, reject) => {
            // write code to close dispute
        });
    }

    getRaisedByEnterpriseName(metaMaskAddressOfLoggedUser) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('BackChainAddressMapping').find()
                .toArray(function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        result = result[0];
                        for (let key in result) {
                            if (result.hasOwnProperty(key)) {
                              if(key == metaMaskAddressOfLoggedUser) {
                                resolve({success : true, entName : result[key]})
                                break;
                              }
                            }
                          }
                    }
                });
        });
    }

    getRaisedByAddress(raisedByName) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('BackChainAddressMapping').find()
                .toArray(function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        result = result[0];
                        let mappingFound = false;
                        for (let key in result) {
                            if (result.hasOwnProperty(key)) {
                                if (result[key] == raisedByName) {
                                    mappingFound = true;
                                    resolve({ success: true, raisedByAddress: key });
                                    break;
                                }
                            }
                        }
                        if (!mappingFound) {
                            resolve({ success: false })
                        }
                    }
                });
        });
    }

    isSubmitDisputeWindowStillOpen(transaction, disputeSubmissionWindowInMinutes) {
        let tnxDuration = moment.duration(moment(new Date()).diff(moment(new Date(transaction.date))));
        let tnxDurationInMinutes = Math.ceil(tnxDuration.asMinutes());
        return {"visible": tnxDurationInMinutes < disputeSubmissionWindowInMinutes, "tnxDurationInMinutes": tnxDurationInMinutes};
    }
}

export const disputeHelper = new DisputeHelper();