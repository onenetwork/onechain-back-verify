import { dbconnectionManager } from './DBConnectionManager';
import { transactionHelper } from './TransactionHelper';
import { settingsHelper } from './SettingsHelper';
import { blockChainVerifier } from './BlockChainVerifier';
import { observable } from 'mobx';
import { Long } from 'mongodb';
import crypto from 'crypto';
import moment from 'moment';
import oneBcClient from '@onenetwork/one-backchain-client';

class DisputeHelper {

    constructor() { }

    getDisputes(filters) {
        let me = this;
        return new Promise((resolve, reject) => {
            this.createFilterQuery(filters)
                .then((query) => {
                    settingsHelper.getApplicationSettings()
                        .then(settings => {
                            let promisesToWaitOn = [];
                            if (query.searchInDraftDisputes) {
                                //Search in DraftDisputesCollection as well
                                promisesToWaitOn.push(me.queryDisputes({}, query));
                            }
                            let disputeBcClient = oneBcClient.createDisputeBcClient({
                                blockchain: 'eth',
                                url: settings.blockChain.url,
                                contentBackchainContractAddress: settings.blockChain.contractAddress,
                                disputeBackchainContractAddress: settings.blockChain.disputeContractAddress
                            });
                            promisesToWaitOn.push(disputeBcClient.filterDisputes(query));
                            Promise.all(promisesToWaitOn).then(function (disputes) {
                                resolve(disputes[0].concat(disputes[1])); //DraftDisputes + Disputes from BlockChain
                            }).catch(err => {
                                reject(err);
                                console.error("Error occured while fetching disputes:" + err);
                            });
                        })
                        .catch(err => {
                            reject("Database Connection has an issue. Check the database's health.");
                        });

                });
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
                                transactionHelper.getTransactionById(dispute.disputedTransactionId, (err, transaction) => {
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
        filters = filters || {};
        return new Promise((resolve, reject) => {
            let query = {};
            query.searchInDraftDisputes = true;
            if (this.isValueNotNull(filters.status)) {
                query.state = { $in: JSON.parse(filters.status) };
            }
            if (this.isValueNotNull(filters.searchTnxId)) {
                query.disputedTransactionId = filters.searchTnxId;
            }
            if (this.isValueNotNull(filters.searchDisputeId)) {
                query.disputeId = filters.searchDisputeId;
            }

            if (this.isValueNotNull(filters.disputeSubmitFromDate)) {
                query.submittedDate = { $gte: JSON.parse(filters.disputeSubmitFromDate) };
            }

            if (this.isValueNotNull(filters.disputeSubmitToDate)) {
                query.submittedDate = { $lte: JSON.parse(filters.disputeSubmitToDate) };
            }

            if (this.isValueNotNull(filters.disputeCloseFromDate)) {
                query.closeDate = { $gte: JSON.parse(filters.disputeCloseFromDate) };
            }

            if (this.isValueNotNull(filters.disputeCloseToDate)) {
                query.closeDate = { $lte: JSON.parse(filters.disputeCloseToDate) };
            }

            if (this.isValueNotNull(filters.reasonCodes)) {
                query.reason = { $in: JSON.parse(filters.reasonCodes) };
            }

            if (this.isValueNotNull(filters.searchBtId)) {
                query.disputedBusinessTransactionIds = filters.searchBtId;
            }

            if (this.isValueNotNull(filters.raisedBy) && filters.entNameOfLoggedUser !== filters.raisedBy) {

                query.searchInDraftDisputes = false;

                me.getRaisedByAddress(filters.raisedBy)
                    .then((result) => {
                        query.disputingParty = result ? result.raisedByAddress : null;
                        resolve(query);
                    });
            } else {
                resolve(query);
            }
        });
    }

    isValueNotNull(value) {
        if (value && value != 'null') {
            return true;
        }
        return false;
    }

    applyTransactionRelatedFilters(dispute, transaction, filters) {
        if (this.isValueNotNull(filters.tnxFromDate)) {
            if (transaction.date >= JSON.parse(filters.tnxFromDate)) {
                dispute.transaction = transaction;
            } else if (dispute.disputedTransactionId == transaction.id) {
                dispute = null;
            }
        }
        if (dispute != null && this.isValueNotNull(filters.tnxToDate)) {
            if (transaction.date <= JSON.parse(filters.tnxToDate)) {
                dispute.transaction = transaction;
            } else if (dispute.disputedTransactionId == transaction.id) {
                dispute = null;
            }
        }
        return dispute;
    }

    getOpenDisputeCount(disputedTransactionId) {
        let me = this;
        return new Promise((resolve, reject) => {
            settingsHelper.getApplicationSettings()
                .then(settings => {
                    let promisesToWaitOn = [];
                    promisesToWaitOn.push(me.getDraftCount(disputedTransactionId));
                    let disputeBcClient = oneBcClient.createDisputeBcClient({
                        blockchain: 'eth',
                        url: settings.blockChain.url,
                        contentBackchainContractAddress: settings.blockChain.contractAddress,
                        disputeBackchainContractAddress: settings.blockChain.disputeContractAddress
                    });
                    //Need to call  disputeBcClient.disputeSummary call once the api is ready. This will return the count from the db.
                    Promise.all(promisesToWaitOn).then(function (counts) {
                        resolve(counts[0]); //Make sure to change and aggregate counts returning from DraftDisputes and BlockChain
                    }).catch(err => {
                        reject(err);
                        console.error("Error occurred while fetching open dispute count." + err);
                    });
                })
                .catch(err => {
                    reject("Database Connection has an issue. Check the database's health.");
                });
        });
    }

    getDraftCount(disputedTransactionId) {
        return new Promise((resolve, reject) => {
            if (disputedTransactionId) {
                dbconnectionManager.getConnection().collection('DraftDisputes').find({ "disputedTransactionId": disputedTransactionId }).count()
                    .then((count) => {
                        resolve(count);
                    })
                    .catch((err) => {
                        console.error("Error occurred while fetching draft count." + err);
                        reject(err);
                    });
            } else {
                dbconnectionManager.getConnection().collection('DraftDisputes').count()
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

    disputeExists(disputedTransactionId) {
        // TODO check if dispute exists in blockchain
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').findOne({ "disputedTransactionId": disputedTransactionId })
                .then((result) => {
                    if (result) {
                        resolve({ success: true, exists: true, status: result.state });
                    } else {
                        resolve({ success: true, exists: false });
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
            this.disputeExists(dispute.disputedTransactionId)
                .then(function (response) {
                    if (response.exists) {
                        resolve(response);
                    } else {
                        me.insertDraft(dispute)
                            .then(function (response) {
                                if (response.success) {
                                    resolve(response);
                                }
                            }, function (error) {
                                console.error(error);
                                reject(error);
                            });
                    }
                }, function (error) {
                    console.error(error);
                    reject(error);
                });
        });
    }

    insertDraft(dispute) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').insert(dispute)
                .then(() => {
                    resolve({ success: true });
                })
                .catch((err) => {
                    console.error("Error occurred while saving dispute as draft: " + err);
                    reject(err);
                });
        });
    }

    generateDisputeId(plainText) {
        return ({ success: true, generatedDisputeId: crypto.createHash('sha256').update(plainText).digest('hex') });
    }

    discardDraftDispute(disputeId) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').deleteOne({ id: disputeId })
                .then((result) => {
                    resolve({ success: true });
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
            transactionHelper.getTransactionById(dispute.disputedTransactionId, (err, transaction) => {
                if (transaction) {
                    me.isSubmitDisputeWindowStillOpen(transaction, disputeSubmissionWindowInMinutes).visible ?
                        resolve({ success: true, submitDisputeMsg: 'Dispute Submitted Successfully.' })
                        :
                        resolve({ success: false, submitDisputeMsg: "Time window to raise a dispute on this transaction has already passed. You have " + disputeSubmissionWindowInMinutes + " minutes to raise disputes on a transaction." });
                }
            });

        });
    }

    closeDispute(disputeId) {
        return new Promise((resolve, reject) => {
            // write code to close dispute
        });
    }

    getRaisedByEnterpriseName(backChainAccountOfLoggedUser) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('BackChainAddressMapping').find()
                .toArray(function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        result = result[0];
                        for (let key in result) {
                            if (result.hasOwnProperty(key)) {
                                if (key == backChainAccountOfLoggedUser) {
                                    resolve({ success: true, entName: result[key] })
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
        return { "visible": tnxDurationInMinutes < disputeSubmissionWindowInMinutes, "tnxDurationInMinutes": tnxDurationInMinutes };
    }

    registerAddress(authenticationToken, chainOfCustodyUrl, backChainAccountOfLoggedUser) {
        return new Promise((resolve, reject) => {
            fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/registerAddress?address=' + backChainAccountOfLoggedUser), {
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
                console.info("Address registered ! " + result);
                resolve(result);
            }).catch((err) => {
                console.error("Address registeration failed: " + err);
                reject(err);
            });
        });
    }
}

export const disputeHelper = new DisputeHelper();