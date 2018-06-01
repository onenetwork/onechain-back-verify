import { dbconnectionManager } from './DBConnectionManager';
import { transactionHelper } from './TransactionHelper';
import { settingsHelper } from './SettingsHelper';
import { blockChainVerifier } from './BlockChainVerifier';
import { backChainUtil } from './BackChainUtil';
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
            let query = this.createFilterQuery(filters);
            let onlyDraft = false;
            if(filters.status && filters.status.length == 1 && filters.status[0] == 'DRAFT') {
                onlyDraft = true;
            }
            settingsHelper.getApplicationSettings()
                .then(settings => {
                    let promisesToWaitOn = [];
                    promisesToWaitOn.push(me.queryDisputes(query.queryForMongo, filters));
                    if(!onlyDraft) {
                        let disputeBcClient = oneBcClient.createDisputeBcClient({
                            blockchain: 'eth',
                            url: settings.blockChain.url,
                            contentBackchainContractAddress: settings.blockChain.contractAddress,
                            disputeBackchainContractAddress: settings.blockChain.disputeContractAddress
                        });
                        promisesToWaitOn.push(disputeBcClient.filterDisputes(query.queryForBC));
                    }                    
                    Promise.all(promisesToWaitOn).then(function (disputes) {
                        if(onlyDraft) {
                            resolve(disputes[0]);
                        } else {
                            me.processIncomingBcDisputes(disputes[1]); //first strip away '0x'
                            me.findAndAddDisputeTransactions(disputes[1], filters). //find and attach transaction data
                            then(function(backChainDisputes) {
                                resolve(disputes[0].concat(backChainDisputes));
                            });
                        }                        
                    }).catch(err => {
                        reject(err);
                    });
                })
                .catch(err => {
                    reject("Database Connection has an issue. Check the database's health.");
                });
        });
    }

    queryDisputes(queryForMongo, filters) {
        let me = this;
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').find(queryForMongo)
                .toArray(function (err, result) {
                    if (err) {
                        console.error("Error occurred while fetching transations by sequencenos." + err);
                        reject(err);
                    } else {
                        me.findAndAddDisputeTransactions(result, filters).
                        then(function(disputes) {
                            me.sortDisputesByAscOrderBasedOnTnxDate(disputes);
                            resolve(disputes);
                        });
                    }
                });
        });
    }

    /**
     * Finds transactions in the database given with disputedTransactionId and appends it to 
     * dispute. If not, found dispute.transaction will be undefined/null
     * @param [] disputes - array of disputes
     */
    findAndAddDisputeTransactions(disputes, filters) {
        let me= this;
        return new Promise((resolve, reject) => {
            var promisesToWaitOn = [];
            for (var i = 0; i < disputes.length; i++) {
                let dispute = disputes[i];
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
        });
    }

    processIncomingBcDisputes(blockChainDisputes) {
        //Convert all bytes to strings and attach transactions to disputes if transaction exists.
        //TODO Remove unnecessary conversations
        for (let i = 0, len = blockChainDisputes.length; i < len; i++) {
            blockChainDisputes[i].disputeId = this.convertByteToString(blockChainDisputes[i].disputeId);
            blockChainDisputes[i].disputedTransactionId = this.convertByteToString(blockChainDisputes[i].disputedTransactionId);
            blockChainDisputes[i].submittedDate = typeof blockChainDisputes[i].submittedDate == 'string' ? parseInt(blockChainDisputes[i].submittedDate) : blockChainDisputes[i].submittedDate;
            blockChainDisputes[i].closedDate = typeof blockChainDisputes[i].closedDate == 'string' ? parseInt(blockChainDisputes[i].closedDate) : blockChainDisputes[i].closedDate;
            if (blockChainDisputes[i].disputedBusinessTransactionIds) {
                for (let j = 0, len = blockChainDisputes[i].disputedBusinessTransactionIds.length; j < len; j++) {
                    blockChainDisputes[i].disputedBusinessTransactionIds[j] = this.convertByteToString(blockChainDisputes[i].disputedBusinessTransactionIds[j]);
                }
            }
        }
    }

    convertByteToString(input) {
        return input.indexOf('0x') == 0 ? input.slice(2) : input;
    }

    createFilterQuery(filters) {
        let me = this;
        filters = filters || {};
        let query = {};
        let queryForMongo = {};
        let queryForBC = {};
        if (this.isValueNotNull(filters.status)) {
            queryForMongo.state = { $in: JSON.parse(filters.status) };
            let bcStatus = [];
            filters.status = JSON.parse(filters.status);
            for(let i = 0; i < filters.status.length; i++) {
                if('DRAFT' !== filters.status[i]) {
                    bcStatus.push(filters.status[i]);
                }
            }
            queryForBC.state = bcStatus;
        }
        if (this.isValueNotNull(filters.searchTnxId)) {
            queryForMongo.disputedTransactionId = filters.searchTnxId;
            queryForBC.disputedTransactionId = filters.searchTnxId;
        }
        if (this.isValueNotNull(filters.searchDisputeId)) {
            queryForMongo.disputeId = filters.searchDisputeId;
            queryForBC.disputeId = filters.searchDisputeId;
        }

        if (this.isValueNotNull(filters.disputeSubmitFromDate)) {
            queryForMongo.submittedDateStart = '';
            queryForBC.submittedDateStart = filters.disputeSubmitFromDate;
        }

        if (this.isValueNotNull(filters.disputeSubmitToDate)) {
            queryForMongo.submittedDateEnd = '';
            queryForBC.submittedDateEnd = filters.disputeSubmitToDate;
        }

        if (this.isValueNotNull(filters.disputeCloseFromDate)) {
            queryForMongo.closedDateStart = '';
            queryForBC.closedDateStart = filters.disputeCloseFromDate;
        }

        if (this.isValueNotNull(filters.disputeCloseToDate)) {
            queryForMongo.disputeCloseToDate = '';
            queryForBC.closedDateEnd = filters.disputeCloseToDate;
        }

        if (this.isValueNotNull(filters.reasonCodes)) {
            queryForMongo.reason = { $in: JSON.parse(filters.reasonCodes) };
            queryForBC.reason = JSON.parse(filters.reasonCodes);
        }

        if (this.isValueNotNull(filters.searchBtId)) {
            queryForMongo.disputedBusinessTransactionIds = filters.searchBtId;
            queryForBC.disputedBusinessTransactionIds = filters.searchBtId;
        }

        if (filters.disputingParty && filters.disputingParty.length > 0) {
            queryForBC.disputingParty = JSON.parse(filters.disputingParty);
        } 
        query = {'queryForMongo' : queryForMongo, 'queryForBC' : queryForBC};
        return(query);
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

    getOpenDisputeCount(disputedTransactionId, disputingPartyAddress) {
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
                    promisesToWaitOn.push(disputeBcClient.getDisputeCount({
                        "disputedTransactionId": disputedTransactionId,
                        "disputingParty": disputingPartyAddress,
                        "state" : ["OPEN"]
                    }));
                    Promise.all(promisesToWaitOn).then(function (counts) {
                        resolve(counts[0] + counts[1]); //Aggregate counts returning from DraftDisputes and BlockChain
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
            dbconnectionManager.getConnection().collection('DraftDisputes').deleteOne({ disputeId: disputeId })
                .then((result) => {
                    resolve({ success: true });
                })
                .catch((err) => {
                    console.error("Error occurred while discarding dispute as draft: " + err);
                    reject(err);
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

    readBackChainAddressMapping() {
        return new Promise((resolve, reject) => {
            let result = dbconnectionManager.getConnection().collection('BackChainAddressMapping').findOne({})
            .then((result) => {
                resolve(result);
            })
            .catch((err) => {
                console.error("Error occurred while reading BackChainAddressMapping");
                reject(err);
            });
        });
    }

    getRaisedByEnterpriseName(backChainAccountOfLoggedUser, backChainAddressMapping) {
        let entName = backChainAccountOfLoggedUser;
        for (let key in backChainAddressMapping) {
            if (backChainAddressMapping.hasOwnProperty(key)) {
                if (key == backChainAccountOfLoggedUser) {
                    entName = backChainAddressMapping[key];
                }
            }
        }
        return entName;
    }

    getDisputingPartyAddress(entName, backChainAddressMapping) {
        let backChainAddressesOfEnt = [];
        for (let key in backChainAddressMapping) {
            if (backChainAddressMapping.hasOwnProperty(key)) {
                let entNameInMapping = backChainAddressMapping[key];
                if(entNameInMapping == entName) {
                    backChainAddressesOfEnt.push(key);
                }
            }
        }
        return backChainAddressesOfEnt;
    }

    sortDisputesByAscOrderBasedOnTnxDate(disputes) {
        let disputesCopy = JSON.parse(JSON.stringify(disputes));

        /*sort never updates the current array object so doing sorting with copy*/
        disputesCopy.sort(function(firstDispute, secondDispute) {
            return  (firstDispute.transaction.date)-(secondDispute.transaction.date);
        });

        disputes.length=0;
        
        for(let i = 0; i < disputesCopy.length; i++) {
                disputes.push(disputesCopy[i]);
        }
    }

    orderDisputes(disputes) {
        let disputesCopy = JSON.parse(JSON.stringify(disputes));

        /*sort never updates the current array object so doing sorting with copy*/
        disputesCopy.sort(function(firstDispute, secondDispute) {
            let first, second;
            switch(firstDispute.state) {
                case 'DRAFT':
                    first = 0;
                break;
                case 'OPEN':
                    first = 1;
                break;
                case 'CLOSED':
                    first = 2;
            }
            switch(secondDispute.state) {
                case 'DRAFT':
                    second = 0;
                break;
                case 'OPEN':
                    second = 1;
                break;
                case 'CLOSED':
                    second = 2;
            }
            return first - second;
        });


        disputes.length=0;

        for(let i = 0; i < disputesCopy.length; i++) {
                disputes.push(disputesCopy[i]);
        }
    }
}

export const disputeHelper = new DisputeHelper();