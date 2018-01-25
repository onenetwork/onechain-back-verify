import {action} from 'mobx';
import {transactionHelper} from './TransactionHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {requestHelper} from './RequestHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';
import moment from 'moment';
import "isomorphic-fetch";
import config from './config';
import { observable } from 'mobx';
import { dbconnectionManager } from './DBConnectionManager';
import { backChainUtil } from './BackChainUtil';

let store;
export default class BackChainActions {

    static init(appStore) {
        store = appStore;
    }

    @action
    static fetchLastSyncDate() {
        fetch('/getLastestSyncedDate', {method: 'GET'}).then(function(response) {
            return response.json();
        }, function(error) {
            console.error('error fetching last sync date');
        }).then(function(result) {
            if(!result.success == false) {
                store.lastestSyncedDate = moment(result.lastestSyncedDate).fromNow();
            }
        })
    }

    @action
    static isInitialSyncDone() {
        fetch('/isInitialSyncDone', { method: 'GET'}).then(function(response) {
            return response.json();
        }, function(error) {
            console.error('error fetching initial sync');
        }).then(function(result) {
            store.isInitialSyncDone = result.isInitialSyncDone;
        })
    }


    /**
     * This method either loads provided array of transaction data, provided as the first argument,
     * or fetches transaction data and loads it into the store, if there are 2 provided arguments (id and searchCriteria).
     * @param {*} id - either a transaction or business id
     * @param {*} searchCriteria - either "tnxId" or "btId"
     */
    @action
    static loadTransactions(id, searchCriteria, callback) {
        store.canStartVerifying = false;
        store.transactions.clear();
        store.verifications.clear();

        if(arguments.length == 1 && Array.isArray(arguments[0])) {
            BackChainActions.loadTransactionsAux(arguments[0]);
            return;
        }

        let uri = null;
        if(searchCriteria == "tnxId") {
             uri = '/getTransactionById/' + id;
        }
        else if(searchCriteria == "btId") {
            uri = '/getTransactionByBusinessTransactionId/' + id;
        }

        store.loadingData = true;
		fetch(uri, {method: 'GET'}).then(function(response) {
			return response.json();
		}, function(error) {
            store.loadingData = false;
            store.error = "Couldn't load transactions. Please try again later";
  			console.error('error getting transaction by transaction id');
		}).then(function(result) {
            store.loadingData = false;
            BackChainActions.loadTransactionsAux(result.result, callback);
  		});
    }

    @action
    static loadTransactionsAux(transactions, callback) {
        transactions.forEach(element => store.transactions.push(element));

        if (store.oneBcClient != null) {
            store.verifications = transactionHelper.generateVerificationData(transactions, store.entNameOfLoggedUser, store.oneBcClient);
        }

        if(transactions.length > 0) {
            store.canStartVerifying = true; // nothing to verify and no animation needed
        }

        if(callback) {
            callback(store.transactions.length > 0);
        }
    }

    @action
    static loadViewTransactionsById(type, partnerEntName, id) {
        store.myAndDiffViewModalType = type;
        for(let i = 0; i < store.transactions.length; i++) {
            let transaction = store.transactions[i];
            if(transaction.id != id) {
                continue;
            }

            const transactionSlices = transaction.transactionSlices;

            let initialValue = 0;
            let condition = idx => idx < transactionSlices.length;
            let action = idx => {
                let transactionSlice = transactionSlices[idx];

                // Always add the enterprise slice to the view.
                if(transactionSlice.type == "Enterprise") {
                    return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                        let newJson = observable({});
                        newJson.id = id;
                        newJson.transactionSlice = JSON.parse(result.result);
                        newJson.transactionSlice.sequence = transactionSlice.sequence;
                        store.viewTransactions.enterprise = newJson;
                    }).then(() => ++idx);
                }

                if(type == "Intersection"
                        && transactionSlice.type == "Intersection"
                            && transactionSlice.enterprises.indexOf(store.entNameOfLoggedUser) > -1
                                && transactionSlice.enterprises.indexOf(partnerEntName) > -1) {
                    return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                        let newJson = observable({});
                        newJson.id = id;
                        newJson.transactionSlice = JSON.parse(result.result);
                        newJson.transactionSlice.sequence = transactionSlice.sequence;
                        store.viewTransactions.intersection = newJson;
                    }).then(() => ++idx);
                }

                return new Promise(resolve => resolve(++idx));
            };

            return backChainUtil.promiseFor(condition, action, initialValue).then(() => {
                BackChainActions.setMyAndDiffViewActive(true);
            });
        }
    }

    @action
    static zipTransactionsByIds(type, partnerEntName, ids) {
        return new Promise(resolve => {
            store.payload.clear();
            store.myAndDiffViewModalType = type;
            for(let i = 0; i < store.transactions.length; i++) {
                let transaction = store.transactions[i];
                for (let j = 0; j < ids.length; j++) {
                    if (transaction.id != ids[j]) {
                        continue;
                    }

                    const id = transaction.id;
                    const transactionSlices = transaction.transactionSlices;

                    let initialValue = 0;
                    let condition = idx => idx < transactionSlices.length;
                    let action = idx => {
                        let transactionSlice = transactionSlices[idx];

                        // Always add the enterprise slice.
                        if(transactionSlice.type == "Enterprise") {
                            return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                                let newJson = observable({});
                                newJson.id = id;
                                newJson.transactionSlice = JSON.parse(result.result);
                                newJson.transactionSlice.sequence = transactionSlice.sequence;
                                store.payload.push(newJson);
                            }).then(() => ++idx);
                        }

                        if(type == "Intersection"
                                && transactionSlice.type == "Intersection"
                                    && transactionSlice.enterprises.indexOf(store.entNameOfLoggedUser) > -1
                                        && transactionSlice.enterprises.indexOf(partnerEntName) > -1) {
                            return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                                let newJson = observable({});
                                newJson.id = id;
                                newJson.transactionSlice = JSON.parse(result.result);
                                newJson.transactionSlice.sequence = transactionSlice.sequence;
                                store.payload.push(newJson);
                            }).then(() => ++idx);
                        }

                        return new Promise(resolve => resolve(++idx));
                    };

                    return backChainUtil.promiseFor(condition, action, initialValue).then(resolve);
                }
            }

            resolve();
        });
    }

    @action
    static saveBlockChainSettings(url, contractAddress, privatekey) {
        let params = {
            'url':url,
            'contractAddress': contractAddress,
            'privatekey': privatekey
            };
        fetch('/saveBlockChainSettings', {
            method: 'post',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
            }),
            body: requestHelper.jsonToUrlParams(params)
          }).then(function(response) {
            return response.json();
          }).then(function(result) {
            if(result.success === true){
                  store.isInitialSetupDone = true;
            }else{
                store.isInitialSetupDone = false;
            }
        })
        .catch(function (err) {
            console.error('Error saving configuration to database!');
            store.isInitialSetupDone = false;
            store.blockChainUrl = null;
            store.blockChainContractAddress = null;
            store.blockChainPrivateKey = null;
          });
    }

    @action
    static setMyAndDiffViewActive(active) {
        store.myAndDiffViewModalActive = active;
    }

    @action
    static toggleDisplayMessageView() {
        store.displayMessageViewModalActive = !store.displayMessageViewModalActive;
    }

    @action
    static toggleDBSyncModalViewActive() {
        store.dbSyncModalViewActive = !store.dbSyncModalViewActive;
    }

    @action
    static toggleStartSyncModalView() {
        store.startSyncViewModalActive = !store.startSyncViewModalActive;
    }

    @action
    static startSync(tokenInputVal, startFromInputVal, chainOfCustodyUrl) {
        if (!store.isInitialSyncDone) {
            let me = this;
            this.startSyncFromCertainDate(tokenInputVal, startFromInputVal, chainOfCustodyUrl, function (req, res) {
                const _this = me;
                if (res == true) {
                    _this.startInitialSync(tokenInputVal, chainOfCustodyUrl);
                }
            });
        } else {
            this.startSyncFromCertainDate(tokenInputVal, startFromInputVal, chainOfCustodyUrl);
		}
    }

    @action
    static processApplicationSettings() {
        /**
         * If the value is null, it means db was never checked for the value.
         * If it's not null, there's no need to go to the db anymore.
         * User have to go to /setup page and enter credentials to set it to true(@saveBlockChainSettings),
         * otherwise it will stay as false.
         */
        if(store.isInitialSetupDone == null) {
            fetch('/getApplicationSettings', { method: 'GET'}).then(function(response) {
                return response.json();
            }).then(function(result) {
                if (result.success && result.settings.blockChain &&
                    result.settings.blockChain.url && result.settings.blockChain.contractAddress
                    && result.settings.blockChain.privateKey) {
                    store.isInitialSetupDone = true;
                    store.blockChainUrl = result.settings.blockChain.url;
                    store.blockChainContractAddress = result.settings.blockChain.contractAddress;
                    store.blockChainPrivateKey = result.settings.blockChain.privateKey;
                } else {
                    store.isInitialSetupDone = false;
                    store.mode = result.settings.mode;
                    store.blockChainUrl=config.blockChainUrl;
                    store.blockChainContractAddress=config.blockChainContractAddress;
                    store.blockChainPrivateKey=config.blockChainpPrivateKey;
                }
                if(result.success && result.settings.chainOfCustidy &&
                    result.settings.chainOfCustidy.authenticationToken) {
                    store.lastestSyncedDate = moment(result.settings.chainOfCustidy.lastSyncTimeInMillis).fromNow();
                    store.authenticationToken = result.settings.chainOfCustidy.authenticationToken;
                    store.chainOfCustodyUrl = result.settings.chainOfCustidy.chainOfCustodyUrl;
                    store.lastSyncTimeInMillis = result.settings.chainOfCustidy.lastSyncTimeInMillis;
                    store.entNameOfLoggedUser = result.settings.chainOfCustidy.enterpriseName;
                  } else {
                      store.authenticationToken = null;
                      store.chainOfCustodyUrl=config.chainOfCustodyUrl;
                }
            }).catch(function(error) {
                store.isInitialSetupDone = null;
                store.authenticationToken = null;
            });
        }
    }

    @action
    static mergeUploadedPayloadWithDb(payloads, callback) {
        let transArr = [];
        let payloadLength = payloads.length;
        let i = 1;
        payloads.forEach(payload => {
            this.findTransaction(payload.id, function(transactions) {
                if (transactions.length > 0) {
                    transaction = transaction[0];
                    let index = transactionHelper.findSliceInTransaction(transaction, payload.transactionSlice);
                    if (index >= 0) {
                        transaction.transactionSliceStrings[index] = payload.transactionSlice;
                        transaction.transactionSlices[index] = JSON.parse(payload.transactionSlice);
                    } else {
                        transaction.transactionSliceStrings.push(payload.transactionSlice);
                        transaction.transactionSlices.push(JSON.parse(payload.transactionSlice));
                    }
                    transArr.push(transaction);
                } else {
                    transArr.push({
                        id: payload.id,
                        transactionSliceStrings: [payload.transactionSlice],
                        transactionSlices: [JSON.parse(payload.transactionSlice)]
                    });
                }

                if (i == payloadLength && transArr.length > 0) {
                    store.transactions.clear();
                    transArr.forEach(element => {
                        store.transactions.push(element);
                    });
                    store.verifications = transactionHelper.storeVerificationData(transArr,store.entNameOfLoggedUser,store.oneBcClient);
                    store.canStartVerifying = true; //nothing to verify and no animation needed
                    callback();
                }
                i++;
            })
        })
    }

    @action
    static findTransaction(transId, callback) {
        let uri = '/getTransactionById/' + transId;
        fetch(uri, {
            method: 'GET'
        }).then(function(response) {
            return response.json();
        }, function(error) {
            console.error('error getting transaction by transaction id in mergeUploadedPayloadWithDb');
        }).then(function(result) {
            if (result.result[0] != false) {
                callback(result.result);
            } else {
                callback(null);
            }
        })
    }

    @action
    static startInitialSync(authenticationToken, chainOfCustodyUrl) {
        let params = {
            'authenticationToken': authenticationToken,
            'chainOfCustodyUrl': chainOfCustodyUrl
        };
        fetch('/consumeTransactionMessages', {
            method: 'post',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
            }),
            body: requestHelper.jsonToUrlParams(params)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if(result.consumeResult.success === true && result.consumeResult.syncDone === true) {
                store.lastestSyncedDate = moment(result.consumeResult.lastSyncTimeInMillis).fromNow();
                store.authenticationToken = result.consumeResult.authenticationToken;
                store.lastSyncTimeInMillis = result.consumeResult.lastSyncTimeInMillis;
                store.chainOfCustodyUrl = result.consumeResult.chainOfCustodyUrl;
            }
        })
        .catch(function (err) {
            log.error("Error occured in startInitialSync.");
        });
    }

    @action
    static startSyncFromCertainDate(authenticationToken, startFromDate, chainOfCustodyUrl,callback) {
        store.startSync = true;
        store.syncGoingOn = true;
        store.startSyncViewModalActive = true;
        let params = {
            'authenticationToken': authenticationToken,
            'startFromDate': startFromDate,
            'chainOfCustodyUrl' : chainOfCustodyUrl
        };
        fetch('/startSyncFromCertainDate', {
            method: 'post',
            headers: new Headers({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
            }),
            body: requestHelper.jsonToUrlParams(params)
        })
        .then(function(response) {
            return response.json();
        })
            .then(function (result) {
            if(result.success) {
                store.authenticationToken = result.authenticationToken;
                store.lastSyncTimeInMillis =result.lastSyncTimeInMillis;
                store.lastestSyncedDate = moment(result.lastSyncTimeInMillis).fromNow();
                store.chainOfCustodyUrl = result.chainOfCustodyUrl;
                store.syncFailed = false;
                store.syncGoingOn = false;
                store.startSync = false;
                store.startSyncViewModalActive = true;
                store.isInitialSyncDone = true;
                if(callback){
                    callback(null,true);
                }
            } else {
                store.syncFailed = true;
                store.syncGoingOn = false;
                store.startSync = false;
                store.startSyncViewModalActive = true;
            }
        })
        .catch(function (err) {
            console.error('Error communicating with PLT');
            store.syncFailed = true;
            store.startSync = false;
            store.startSyncViewModalActive = true;
        });
    }

    @action
    static verifyBackChainSettings(oneBcClient,callback) {
        oneBcClient.getOrchestrator()
        .then(function (result) {
            return result;
        })
        .then(function (result) {
            callback(null,result);
        })
        .catch(function (error) {
            callback(error,null);
        });
    }

    @action
    static syncStatisticsInfo() {
        fetch('/getSyncStatisticsInfo', {method: 'GET'})
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if(result.success) {
                let statisticsInfo = result.statisticsInfo;
                store.gapExists = statisticsInfo.gapExists;
                store.syncStatisticsExists = statisticsInfo.syncStatisticsExists;
                store.noOfGaps = statisticsInfo.noOfGaps;
            }
        })
        .catch(function (err) {
            console.log('getSyncStatisticsInfo error');
        });
    }

    @action
    static getSyncStatistics(callback) {
        fetch('/getSyncStatistics', {method: 'GET'})
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if(result.success) {
                store.syncStatistics = result.statistics;
                callback(null, result.statistics);
            }
        })
        .catch(function (err) {
            callback(err, null);
            console.log('getSyncStatistics error');
        });
    }

    @action
    static getTransactionsBySequenceNos(sequenceNoArr, callback) {
        fetch('/getTransactionsBySequenceNos/' + JSON.stringify(sequenceNoArr), { method: 'GET'})
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if(result.success) {
                callback(null, result.txns);
            }
        })
        .catch(function (err) {
            callback(err, null);
            console.log('getSyncStatistics error');
        });
    }

    @action
    static loadEventsForTransaction(transId) {
        if(store.eventsTransactionId === transId) {
            return;
        }

        let uri = '/getEventsForTransaction/' + transId;
        fetch(uri, { method: 'GET' }).then(function(response) {
            return response.json();
        }, function(error) {
            console.error(error);
        }).then(action(function(json) {
            store.eventsTransactionId = transId;
            store.events = json.result;
        }));
    }

    @action
    static getTransactionSlice(payloadId) {
        let uri = '/getTransactionSlice/' + payloadId;
        return fetch(uri, { method: 'GET' }).then(function(response) {
            return response.json();
        }, function(error) {
            console.error(error);
        })
    }

}
