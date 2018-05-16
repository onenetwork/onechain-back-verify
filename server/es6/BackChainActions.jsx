import {action} from 'mobx';
import {transactionHelper} from './TransactionHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {requestHelper} from './RequestHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';
import moment from 'moment';
import "isomorphic-fetch";
import config from './config';
import { observable } from 'mobx';
import oneBcClient from '@onenetwork/one-backchain-client';
import { dbconnectionManager } from './DBConnectionManager';
import { backChainUtil } from './BackChainUtil';


const MAX_EVENTS_TO_LOAD = 30;

let store;
export default class BackChainActions {

    static init(appStore, options) {
        store = appStore;

        if (options.getTransactionSliceByHash) {
            store.sliceDataProvidedByAPI = true;
            BackChainActions.getSliceDataFromAPI = options.getTransactionSliceByHash;
        }
        if (options.disputeExists && options.getOpenDisputeCount && options.getDisputes) {
            store.disputeDataProvidedByAPI = true;
            BackChainActions.getOpenDisputeCountFromAPI = options.getOpenDisputeCount;
            BackChainActions.loadDisputesFromAPI = options.getDisputes;
            BackChainActions.disputeExistsFromAPI = options.disputeExists;
        }
    }

    @action
    static fetchLastSyncDate() {
        fetch('/getLastestSyncedDate', {method: 'GET'}).then(function(response) {
            return response.json();
        }, function(error) {
            console.error('error fetching last sync date');
        }).then(function(result) {
            if(result && result.success) {
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
            if(result) {
                store.isInitialSyncDone = result.isInitialSyncDone;
            }
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
        store.transactions.clear();

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
            if(result) {
                BackChainActions.loadTransactionsAux(result.result, callback);
            }
  		});
    }

    @action
    static loadTransactionsAux(transactions, callback) {
        let count = 0;
        transactions.forEach(element => {
            BackChainActions.getOpenDisputeCount(element.id)
                .then(function (result) {
                    element.openDisputeCount = result;
                    BackChainActions.disputeExists(element.id)
                        .then(function (result) {
                            element.disputeExists = result;
                            store.transactions.push(element);
                            if (++count == transactions.length) {
                                transactionHelper.generateVerificationDataAndStartVerifying(transactions, store);
                            }
                        })
                })
                .catch(function (error) {
                    element.openDisputeCount = 0;
                    element.disputeExists = false
                    store.transactions.push(element);
                    if (++count == transactions.length) {
                        transactionHelper.generateVerificationDataAndStartVerifying(transactions, store);
                    }
                });
        });

        if (callback) {
            callback(transactions.length > 0);
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
                    if(transactionSlice.payloadId) {
                        return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                            let newJson = observable({});
                            newJson.id = id;
                            newJson.transactionSlice = JSON.parse(result.result);
                            store.viewTransactions.enterprise = newJson;
                        }).then(() => ++idx);
                    }
                    else if(store.sliceDataProvidedByAPI) {   // Slice comes from the API (for the Chain of Custody usecase)
                        return BackChainActions.getSliceDataFromAPI(id, transaction.transactionSliceHashes[idx], transactionSlice.sequence)
                          .then(serializedSlice => {
                              let newJson = observable({});
                              newJson.id = id;
                              newJson.transactionSlice = JSON.parse(serializedSlice);
                              store.viewTransactions.enterprise = newJson;
                          }).then(() => ++idx);
                    }
                    else {  // Comes from a payload
                        let newJson = observable({});
                        newJson.id = id;
                        newJson.transactionSlice = transactionSlice;
                        store.viewTransactions.enterprise = newJson;
                    }
                }

                if(type == "Intersection" && transactionSlice.type == "Intersection"
                    && transactionSlice.enterprises.indexOf(partnerEntName) > -1) {
                    if(transactionSlice.payloadId) {
                        return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                            let newJson = observable({});
                            newJson.id = id;
                            newJson.transactionSlice = JSON.parse(result.result);
                            store.viewTransactions.intersection = newJson;
                        }).then(() => ++idx);
                    }
                    else if(store.sliceDataProvidedByAPI) {   // Slice comes form the API (for the Chain of Custody usecase)
                        return BackChainActions.getSliceDataFromAPI(id, transaction.transactionSliceHashes[idx], transactionSlice.sequence)
                          .then(serializedSlice => {
                              let newJson = observable({});
                              newJson.id = id;
                              newJson.transactionSlice = JSON.parse(serializedSlice);
                              store.viewTransactions.intersection = newJson;
                          }).then(() => ++idx);
                    }
                    else {  // Comes from a payload and won't have two slices to compare so always go with enterprise 
                        store.myAndDiffViewModalType = "Enterprise";
                        let newJson = observable({});
                        newJson.id = id;
                        newJson.transactionSlice = transactionSlice;
                        store.viewTransactions.enterprise = newJson;                        
                    }
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
            let trvrsTnxInitVal = 0;
            let trvrsTnxCondition = trvrsTnxIdx => trvrsTnxIdx < store.transactions.length;
            let traverseTransactions = trvrsTnxIdx => {
                let transaction = store.transactions[trvrsTnxIdx];
                let trvrsIdInitVal = 0;
                let trvrsIdCondition = idx => idx < ids.length;
                let traverseIds = idx => {
                    if (transaction.id != ids[idx]) {
                        return new Promise(resolve => resolve(++idx));;
                    }
                    const id = transaction.id;
                    const date = transaction.date;
                    const transactionSlices = transaction.transactionSlices;
                    for (let j = 0; j < transactionSlices.length; j++) {
                        let transactionSlice = transactionSlices[j];
                        if(type == "Enterprise"
                            && transactionSlice.type == "Enterprise") {
                            if(transactionSlice.payloadId) {
                                return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                                    let newJson = observable({});
                                    newJson.id = id;
                                    newJson.date = date;
                                    newJson.transactionSlice = result.result;
                                    store.payload.push(newJson);
                                }).then(() => ++idx);
                            }
                            else if(store.sliceDataProvidedByAPI) {   // Slice comes from the API (for the Chain of Custody usecase)
                                return BackChainActions.getSliceDataFromAPI(id, transaction.transactionSliceHashes[j], transactionSlice.sequence)
                                  .then(serializedSlice => {
                                      let newJson = observable({});
                                      newJson.id = id;
                                      newJson.date = date;
                                      newJson.transactionSlice = serializedSlice;
                                      store.payload.push(newJson);
                                  }).then(() => ++idx);
                            }
                            else {  // Comes from a payload
                                let newJson = observable({});
                                newJson.id = id;
                                newJson.date = date;
                                newJson.transactionSlice = transaction.transactionSlicesSerialized[j];
                                store.payload.push(newJson);
                            }
                        }

                        if(type == "Intersection" && transactionSlice.type == "Intersection"
                            && transactionSlice.enterprises.indexOf(partnerEntName) > -1) {
                            if(transactionSlice.payloadId) {
                                return BackChainActions.getTransactionSlice(transactionSlice.payloadId).then(result => {
                                    let newJson = observable({});
                                    newJson.id = id;
                                    newJson.date = date;
                                    newJson.transactionSlice = result.result;
                                    store.payload.push(newJson);
                                }).then(() => ++idx);
                            }
                            else if(store.sliceDataProvidedByAPI) {   // Slice comes from the API (for the Chain of Custody usecase)
                                return BackChainActions.getSliceDataFromAPI(id, transaction.transactionSliceHashes[j], transactionSlice.sequence)
                                  .then(serializedSlice => {
                                      let newJson = observable({});
                                      newJson.id = id;
                                      newJson.date = date;
                                      newJson.transactionSlice = serializedSlice;
                                      store.payload.push(newJson);
                                  }).then(() => ++idx);
                            }
                            else {  // Comes from a payload
                                let newJson = observable({});
                                newJson.id = id;
                                newJson.date = date;
                                newJson.transactionSlice = transaction.transactionSlicesSerialized[j] ;
                                store.payload.push(newJson);
                            }
                        }
                    }
                    return new Promise(resolve => resolve(++idx));
                }
                return backChainUtil.promiseFor(trvrsIdCondition, traverseIds, trvrsIdInitVal).then(() => ++trvrsTnxIdx);
            }
            return backChainUtil.promiseFor(trvrsTnxCondition, traverseTransactions, trvrsTnxInitVal).then(resolve);
        });
    }

    @action
    static saveBlockChainSettings(url, contractAddress, disputeContractAddress, disputeSubmissionWindowInMinutes) {
        const params = { url, contractAddress, disputeContractAddress, disputeSubmissionWindowInMinutes };
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
            store.disputeBlockChainContractAddress = null;
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
    static toggleNewDisputeModalView() {
        store.newDisputeModalActive = !store.newDisputeModalActive;
    }
    
    @action
    static closeAlertPopup() {
        store.displayAlertPopup = false;
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
                    result.settings.blockChain.url && result.settings.blockChain.contractAddress &&
                    result.settings.blockChain.disputeContractAddress && /*submissionWindow can return as 0 if PLT hasn't submitted a value 0 is considered as false*/
                    typeof result.settings.blockChain.disputeSubmissionWindowInMinutes != 'undefined') {
                    store.isInitialSetupDone = true;
                    store.blockChainUrl = result.settings.blockChain.url;
                    store.blockChainContractAddress = result.settings.blockChain.contractAddress;
                    store.disputeBlockChainContractAddress = result.settings.blockChain.disputeContractAddress;
                    store.disputeSubmissionWindowInMinutes = result.settings.blockChain.disputeSubmissionWindowInMinutes;
                } else {
                    store.isInitialSetupDone = false;
                    store.mode = result.settings.mode;
                    store.blockChainUrl = config.blockChainUrl;
                    store.blockChainContractAddress = config.blockChainContractAddress;
                    store.disputeBlockChainContractAddress = config.disputeBlockChainContractAddress;
                    store.disputeSubmissionWindowInMinutes = 24 * 60; //Default value is one day in minutes.
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
                store.disputeSubmissionWindowInMinutes = null;
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
                let payloadHash = blockChainVerifier.generateHash(payload.transactionSlice);
                if (transactions.length > 0) {
                    let transaction = transactions[0];
                    transaction.transactionSlicesSerialized = [];
                    let index = transactionHelper.findSliceInTransaction(transaction, payload.transactionSlice);
                    if (index >= 0) {
                        transaction.transactionSlices[index] = JSON.parse(payload.transactionSlice);
                        transaction.transactionSlicesSerialized[index] = payload.transactionSlice;
                        transaction.trueTransactionSliceHashes[index] = payloadHash;
                    } else {
                        transaction.transactionSlices.push(JSON.parse(payload.transactionSlice));
                        transaction.transactionSlicesSerialized.push(payload.transactionSlice);
                        transaction.trueTransactionSliceHashes.push(payloadHash);
                        transaction.transactionSliceHashes.push(payloadHash);
                    }
                    transArr.push(transaction);
                } else {
                    const sliceObject = JSON.parse(payload.transactionSlice);                    
                    transArr.push({
                        id: payload.id,
                        transactionSlices: [sliceObject],
                        transactionSlicesSerialized: [payload.transactionSlice], //helper field to be used in download
                        eventCount: transactionHelper.getEventCount(sliceObject),
                        executingUsers: transactionHelper.addExecutingUsers([], sliceObject),
                        trueTransactionSliceHashes: [payloadHash],
                        transactionSliceHashes : [payloadHash]
                    });
                }

                if (i == payloadLength && transArr.length > 0) {
                    store.transactions.clear();
                    transArr.forEach(element => {
                        store.transactions.push(element);
                    });
                    transactionHelper.generateVerificationDataAndStartVerifying(transArr, store);
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
    static startSyncFromCertainDate(authenticationToken, startFromDate, chainOfCustodyUrl, callback) {
        store.startSync = true;
        BackChainActions.displayAlertPopup('Syncing', 'Refreshing your database.This may take a few minutes.');
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
                store.startSync = false;
                store.isInitialSyncDone = true;
                BackChainActions.displayAlertPopup('Update Successful', 'Your database has been successfully synced to the backchain.', 'SUCCESS');
                if(callback){
                    callback(null,true);
                }
            } else {
                BackChainActions.displayAlertPopup('Update Failed', "Couldn't start synchronization.Please try again later!", 'ERROR');
            }
        })
        .catch(function (err) {
            console.error('Error communicating with PLT: ' + err);
            BackChainActions.displayAlertPopup('Update Failed', "Couldn't start synchronization.Please try again later!", 'ERROR');
        });
    }

    @action
    static startGapSync(authenticationToken, chainOfCustodyUrl, gaps, callback) {
        if(gaps == null || gaps.length == 0) {
            if(callback){
                callback(null,true);
            }
            return;
        }
        BackChainActions.displayAlertPopup('Syncing', 'Refreshing your database.This may take a few minutes.');
        let params = {
            'authenticationToken': authenticationToken,
            'gaps': gaps,
            'chainOfCustodyUrl' : chainOfCustodyUrl
        };
        fetch('/startGapSync', {
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
                store.isInitialSyncDone = true;
                BackChainActions.displayAlertPopup('Update Successful', 'Your database has been successfully synced to the backchain.', 'SUCCESS');
                if(callback){
                    callback(null,true);
                }
            } else {
                BackChainActions.displayAlertPopup('Update Failed', "Couldn't start synchronization.Please try again later!", 'ERROR');
            }
        })
        .catch(function (err) {
            console.error('Error communicating with PLT: ' + err);
            BackChainActions.displayAlertPopup('Update Failed', "Couldn't start synchronization.Please try again later!", 'ERROR');
        });
    }


    @action
    static verifyBackChainSettings() {
        //Verify orchestrator first and then getDisputeSubmissionWindows to make sure required things work.
        try {
            let contentBcClient = oneBcClient.createContentBcClient({
                blockchain: 'eth',
                url: store.blockChainUrl,
                contentBackchainContractAddress: store.blockChainContractAddress,
                disputeBackchainContractAddress: store.disputeBlockChainContractAddress
            });
            
            contentBcClient.getOrchestrator()
            .then(function (result) {
                //Content BackChain credentials are correct and the connection is established. Try it for disputeContentBackChain
                let disputeBcClient = oneBcClient.createDisputeBcClient({
                    blockchain: 'eth',
                    url: store.blockChainUrl,
                    contentBackchainContractAddress: store.blockChainContractAddress,
                    disputeBackchainContractAddress: store.disputeBlockChainContractAddress
                });	

                disputeBcClient.getDisputeSubmissionWindowInMinutes().
                then(function(result){
                    store.disputeSubmissionWindowInMinutes = parseInt(result);
                    BackChainActions.saveBlockChainSettings(store.blockChainUrl, store.blockChainContractAddress, store.disputeBlockChainContractAddress, store.disputeSubmissionWindowInMinutes);
                }).
                catch(function(error) {
                    BackChainActions.displayAlertPopup("Dispute BackChain Communication Failed", "Could not connect to the dispute backchain, please check dispute backchain contract address and try again.",'ERROR');
                });
            })
            .catch(function (error) {
                BackChainActions.displayAlertPopup("Content BackChain Communication Failed", "Could not connect to the content backchain, please check your settings and try again.",'ERROR');
            });
        } catch(error) {
            BackChainActions.displayAlertPopup("BackChain Communication Failed", "Could not connect to the backchain, please check your settings and try again.",'ERROR');
            console.error(error);
        }                
    }

    @action
    static displayAlertPopup(title, message, level) {
        BackChainActions.closeAlertPopup();
        store.alertPopupLevel = level;
        store.alertPopupTitle = title;
        store.alertPopupContent = message;
        store.displayAlertPopup = true;
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
    static populateStoreWithApplicationSettings() {
        fetch('/getApplicationSettings', {method: 'GET'})
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if(result.success) {
                store.authenticationToken = result.settings.chainOfCustidy.authenticationToken;
                store.chainOfCustodyUrl = result.settings.chainOfCustidy.chainOfCustodyUrl;
                store.entNameOfLoggedUser = result.settings.chainOfCustidy.enterpriseName;
                //Add more when needed
            }
        })
        .catch(function (err) {
            console.log('Error occured while populating application settings');
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
    static loadEventsForTransaction(transaction) {
        if(store.eventsTransactionId === transaction.id) {
            return;
        }

        if(store.sliceDataProvidedByAPI) {
            for(let i = 0; i < transaction.transactionSlices.length; i++) {
                let transactionSlice = transaction.transactionSlices[i];
                if(transactionSlice.type == 'Enterprise') {
                    BackChainActions.getSliceDataFromAPI(transaction.id, transaction.transactionSliceHashes[i], transactionSlice.sequence)
                        .then(action(serializedSlice => {
                            let sliceData = JSON.parse(serializedSlice);
                            let events = transactionHelper.extractEventsFromSlice(sliceData);

                            if(sliceData.businessTransactions.length > MAX_EVENTS_TO_LOAD) {
                                events.push(sliceData.businessTransactions.length - MAX_EVENTS_TO_LOAD);
                            }

                            store.eventsTransactionId = transaction.id;
                            store.events = events;
                        }));
                    return;
                }
            }

            console.log('Warning: Slice with type "Enterprise" not found in the transaction.');
            return;
        }

        let uri = '/getEventsForTransaction/' + transaction.id;
        fetch(uri, { method: 'GET' }).then(function(response) {
            return response.json();
        }, function(error) {
            console.error(error);
        }).then(action(function(json) {
            store.eventsTransactionId = transaction.id;
            if(json.result.length == 0) {
                //Transaction doesn't exist in db, so find events within the payload.
                store.events = transactionHelper.extractEventsFromSlice(transaction.transactionSlices[0])
            } else {                
                store.events = json.result;
            }            
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

    @action
    static loadDisputes(filters) {
        store.disputes.clear();
        store.loadingData = true;
        //Handle filters properly while fetching either from mongoDb or blockChain(through one-chain-back-client)
        const loadDisputesPromise = store.disputeDataProvidedByAPI
            ? BackChainActions.loadDisputesFromAPI(filters)
            : fetch('/getDisputes', {
                method: 'post',
                headers: new Headers({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                body: requestHelper.jsonToUrlParams(filters)
            }).then(response => response.json());

        loadDisputesPromise.then(result => {
            store.loadingData = false;
            if (result && result.success) {
                result.disputes.forEach(dispute => {
                    store.disputes.push(dispute);
                });
            } else {
                store.error = "Couldn't load disputes. Please try again later";
                console.error('error getting disputes');
            }
        }).catch(error => {
            store.loadingData = false;
            store.error = "Couldn't load disputes. Please try again later";
            console.error('error getting disputes');
        });
    }

    @action
    static getOpenDisputeCount(transactionId) {
        const getOpenDisputeCountPromise = store.disputeDataProvidedByAPI
            ? BackChainActions.getOpenDisputeCountFromAPI(transactionId)
            : fetch('/getOpenDisputeCount/' + transactionId, { method: 'GET' }).then(response => response.json());
        
        return new Promise(resolve => {
            getOpenDisputeCountPromise.then(result => {
                if (result && result.success) {
                    store.openDisputeCountOfLoggedUser = result.disputeCount;
                    resolve(result.disputeCount);
                } else {
                    console.error('error getting dispute count');
                }
            }).catch(error => {
                console.error('error getting dispute count');
                console.log(error);
            });
        });
    }

    @action
    static populateDisputeTransaction(transactionId) {
        this.clearDisputeTransaction();
        return new Promise(function(resolve, reject) {
            let disputeTnxExistsInStore = false;
            for(let i = 0; i < store.transactions.length; i++) {
                let transaction = store.transactions[i];
                if(transaction.id === transactionId) {
                    store.disputeTransaction = transaction;
                    disputeTnxExistsInStore = true;
                    break;
                }
            }
            if(disputeTnxExistsInStore) {
                resolve(true);
            } else {
                let uri = '/getTransactionById/' + transactionId;
                fetch(uri, {method: 'GET'}).then(function(response) {
                    return response.json();
                }, function(error) {
                    console.error('error getting transaction by transaction id for populateDisputeTransaction');
                    reject("Transaction ID: " + transactionId + " could not be found. Please enter a valid transaction ID.");
                }).then(function(result) {
                    if(result.result.length > 0) {
                        store.disputeTransaction = result.result[0];
                        resolve(true);
                    } else {
                        reject("Transaction ID: " + transactionId + " could not be found. Please enter a valid transaction ID.");
                    }
                });
            }
        })
    }
    
    @action
    static clearDisputeTransaction() {
        store.disputeTransaction = null; 
    }

    @action
    static clearDisputeId() {
        store.generatedDisputeId = null; 
    }

    @action
    static saveDisputeAsDraft(dispute) {
        return new Promise(resolve => {
            let uri = '/saveDisputeAsDraft/' + JSON.stringify(dispute);
            return fetch(uri, { method: 'POST' })
            .then(function(response) {
                return response.json();
            }, function(error) {
                console.error(error);
            }).then(function(response) {
                if(response.success && !response.exists) {
                    dispute.transaction = store.disputeTransaction;
                    store.disputes.unshift(dispute);
                }
                resolve(response);
            })
        })
    }

    @action
    static discardDisputeDraft(disputeId) {
        return new Promise(resolve => {
            let uri = '/discardDraftDispute/' + disputeId;
            return fetch(uri, { method: 'POST' })
                .then(function (response) {
                    return response.json();
                }, function (error) {
                    console.error(error);
                }).then(function (result) {
                    if (result.success) { 
                        let currentDisputes = store.disputes;
                        for (let i = 0; currentDisputes && i < currentDisputes.length; i++) {
                            if (disputeId == currentDisputes[i].disputeId) {
                                currentDisputes.splice(i, 1);
                                break;
                            }
                        }
                        store.disputes = currentDisputes;
                    } else {
                        console.error('error while discarding dispute draft.');
                    }
                })
        })
    }

    @action
    static closeDispute(disputeId) {
        return new Promise(resolve => {
            //Should send a close call to backchain for this specific dispute 
            //Once the request returns, go ahead and update the list of disputes
            resolve(true); //Decide what to return
        })
    }

    @action
    static submitDispute(dispute, disputeSubmissionWindowInMinutes) {
        return new Promise(resolve => {
            //First submits dispute to blockchain.
            //If the call is successful, it removes the draft from database.
            //Once both operations are complete, go ahead and update the list of disputes
            let params = {
                'dispute': dispute,
                'disputeSubmissionWindowInMinutes': disputeSubmissionWindowInMinutes
            };
            fetch('/submitDispute', {
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
            }, function(error) {
                console.error(error);
            }).then(function(response) {
                resolve(response);
            })
        })
    }

    @action
    static disputeExists(disputedTransactionId) {
        const disputeExistsPromise = store.disputeDataProvidedByAPI
          ? BackChainActions.disputeExistsFromAPI(disputedTransactionId)
          : fetch('/disputeExists/' + disputedTransactionId, { method: 'GET' }).then(response => response.json());

        return new Promise(resolve => {
            disputeExistsPromise.then(result => {
                if (result.success) {
                    resolve(result.exists);
                } else {
                    console.error('error getting dispute count');
                }
            }).catch(error => {
                console.error('error getting dispute count');
            });
        });
    }

    @action
    static generateDisputeId(plainText) {
        this.clearDisputeId();
        let uri = '/generateDisputeId/' + plainText;
        return fetch(uri, { method: 'GET' })
        .then(function(response) {
            return response.json();
        }, function(error) {
            console.error(error);
        }).then(function(response){
            if(response.success) {
                store.generatedDisputeId = response.generatedDisputeId;
            }
        });
    }

    @action
    static registerAddress(backChainAccountOfLoggedUser) {
        let params = {
            'authenticationToken': store.authenticationToken,
            'chainOfCustodyUrl': store.chainOfCustodyUrl,
            'backChainAccountOfLoggedUser':backChainAccountOfLoggedUser
        };
        fetch('/registerAddress', {
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
        }, function(error) {
            console.error(error);
        }).then(function(response) {
            if(response.success)
                store.backChainAccountOfLoggedUser = backChainAccountOfLoggedUser;
        })
    }

    @action
    static populateBusinessTransactionIds(businessTransactionId) {
        store.listBusinessTransactionIds = businessTransactionId;
    }
}