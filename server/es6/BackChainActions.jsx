import {action} from 'mobx';
import {transactionHelper} from './TransactionHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {requestHelper} from './RequestHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';
import moment from 'moment';
import "isomorphic-fetch";

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
     * Fetches transaction data and loads it into the store
     * @param {*} id - either a transaction or business id
     * @param {*} searchCriteria - either "tnxId" or "btId"
     */
    @action
    static loadTransactions(id, searchCriteria) {
        let uri = null;

        store.loadingData = true;
        store.canStartVerifying = false;
        store.transactions.clear();
        store.verifications.clear();
        
        if(searchCriteria == "tnxId") {
             uri = '/getTransactionById/' + id;
        }
        else if(searchCriteria == "btId") {
            uri = '/getTransactionByBusinessTransactionId/' + id;
        }

		fetch(uri, {method: 'GET'}).then(function(response) {
			return response.json();
		}, function(error) {
            store.loadingData = false;
            store.error = "Couldn't load transactions. Please try again later";
  			console.error('error getting transaction by transaction id');
		}).then(function(result) {            
            result.result.forEach(element => {
                store.transactions.push(element);
            });
            // can give some errors here if oneBcClient settings are null
            if (store.oneBcClient != null) {
                store.verifications = transactionHelper.storeVerificationData(result.result, store.entNameOfLoggedUser, store.oneBcClient);
            }
            if(result.result.length > 0) {
                store.canStartVerifying = true; //nothing to verify and no animation needed
            }
  		})
    }

    @action
    static loadViewTransactionsById(type, partnerEntName, id) {
        store.myAndDiffViewModalType = type;
        store.transactions.forEach(transElement => {
                if(transElement.id == id) {
                    let id = transElement.id;
                    let transactionSliceObjects =transElement.transactionSliceObjects;
                    for(let j=0; j<transactionSliceObjects.length; j++) {
                        /* Always add transactionSlice in viewTransactions no matter @param type is Enterprise or Intersection*/
                        if(transactionSliceObjects[j].type == "Enterprise") {
                            let newJson = {};
                            newJson.id = id;
                            newJson.transactionSlice = transactionSliceObjects[j];
                            store.viewTransactions.enterprise = newJson;
                        }
                        if(type == "Intersection"
                                && transactionSliceObjects[j].type == "Intersection"
                                    && ( transactionSliceObjects[j].enterprises.indexOf(store.entNameOfLoggedUser) > -1 
                                        &&  transactionSliceObjects[j].enterprises.indexOf(partnerEntName) > -1)) {
                                let newJson = {};
                                newJson.id = id;
                                newJson.transactionSlice = transactionSliceObjects[j];
                                store.viewTransactions.intersection = newJson;
                        }
                    }
                }               
        })
    }

    @action
    static zipTransactionsByIds(type, partnerEntName, ids, callback) {
        store.payload.clear();
        store.myAndDiffViewModalType = type;
        store.transactions.forEach(transElement => {
            for (let index in ids) {
                if (transElement.id == ids[index]) {
                    let id = transElement.id;
                    let transactionSliceObjects = transElement.transactionSliceObjects;
                    for (let j = 0; j < transactionSliceObjects.length; j++) {
                        if (type == transactionSliceObjects[j].type) {
                            if (transactionSliceObjects[j].type == "Enterprise") {
                                let newJson = {};
                                newJson.id = id;
                                newJson.transactionSlice = transElement.transactionSlices[j];
                                store.payload.push(newJson);
                            } else if (transactionSliceObjects[j].type == "Intersection" &&
                                (transactionSliceObjects[j].enterprises.indexOf(store.entNameOfLoggedUser) > -1 &&
                                    transactionSliceObjects[j].enterprises.indexOf(partnerEntName) > -1)) {
                                let newJson = {};
                                newJson.id = id;
                                newJson.transactionSlice = transElement.transactionSlices[j];
                                store.payload.push(newJson);
                            }
                        }
                    }
                   
                }
            }
        })
        callback();
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
    static toggleMyAndDiffView() {
        store.myAndDiffViewModalActive = !store.myAndDiffViewModalActive;
    }

    @action
    static toggleStartSyncModalView() {
        store.startSyncModalViewModalActive = !store.startSyncModalViewModalActive;
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
                }
                if(result.success && result.settings.chainOfCustidy &&
                    result.settings.chainOfCustidy.authenticationToken) {
                    store.lastestSyncedDate = moment(result.settings.chainOfCustidy.lastSyncTimeInMillis).fromNow();
                    store.authenticationToken = result.settings.chainOfCustidy.authenticationToken;
                    store.backChainURL = result.settings.chainOfCustidy.backChainURL;
                    store.lastSyncTimeInMillis = result.settings.chainOfCustidy.lastSyncTimeInMillis;
                  } else {
                      store.authenticationToken = null;
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
            this.findTransaction(payload.id, function(transaction) {
                if (transaction) {
                    transaction = transaction[0];
                    let index = transactionHelper.findSliceInTransaction(transaction, payload.transactionSlice);
                    if (index != null) {
                        transaction.transactionSlices[index] = payload.transactionSlice;
                        transaction.transactionSliceObjects[index] = JSON.parse(payload.transactionSlice);
                    } else {
                        transaction.transactionSlices.push(payload.transactionSlice);
                        transaction.transactionSliceObjects.push(JSON.parse(payload.transactionSlice));
                    }
                    transArr.push(transaction);
                } else {
                    transArr.push({
                        id: payload.id,
                        transactionSlices: [payload.transactionSlice],
                        transactionSliceObjects: [JSON.parse(payload.transactionSlice)]
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
    static startInitialSync(authenticationToken, backChainURL) {
        store.syncGoingOn = true;
        let params = {
            'authenticationToken': authenticationToken,
            'backChainURL': backChainURL
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
                store.isInitialSyncDone = true;
                store.syncGoingOn = false;
                store.syncFailed = false;
                store.lastestSyncedDate = moment(result.consumeResult.lastSyncTimeInMillis).fromNow();
                store.authenticationToken = result.consumeResult.authenticationToken;
                store.lastSyncTimeInMillis = result.consumeResult.lastSyncTimeInMillis;
                store.backChainURL = result.consumeResult.backChainURL;
                setTimeout(function() {
                    store.startSyncModalViewModalActive = false; //Close the Modal
                }, 2000)
            } else {
                store.startSyncModalViewModalActive = true; //Keep the modal open and display an error
                store.syncFailed = true;
            }
        })
        .catch(function (err) {
            store.syncFailed = true;
        });
    }

    @action
    static startSyncFromCertainDate(authenticationToken, startFromDate, backChainURL) {
        store.syncGoingOn = true;
        let params = {
            'authenticationToken': authenticationToken,
            'startFromDate': startFromDate,
            'backChainURL' : backChainURL
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
        .then(function(result) { 
            if(result.success) {
                store.authenticationToken = result.authenticationToken;
                store.lastSyncTimeInMillis =result.lastSyncTimeInMillis;
                store.lastestSyncedDate = moment(result.lastSyncTimeInMillis).fromNow();
                store.syncFailed = false;
                store.syncGoingOn = false;
                store.backChainURL = result.backChainURL;
                store.startSyncModalViewModalActive = false; //Close the Modal
            } else {
                store.startSyncModalViewModalActive = true; //Keep the modal open and display an error
                store.syncFailed = true;
            }            
        })
        .catch(function (err) {
            console.error('Error communicating with PLT');
            store.startSyncModalViewModalActive = true; //Keep the modal open and display an error
            store.syncFailed = true;
        });
    }
}