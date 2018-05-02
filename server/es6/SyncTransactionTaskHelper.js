import config from './config';
import {dbconnectionManager} from './DBConnectionManager';
import moment from 'moment';
import {requestHelper} from './RequestHelper';
import {backChainUtil} from  './BackChainUtil';
import "isomorphic-fetch";
import { settingsHelper } from './SettingsHelper';
import { receiveTransactionsTask } from './ReceiveTransactionsTask';

let syncing = false;
let pendingResets = [];

/*
 Helper class contains synch related APIs
*/
class SyncTransactionTaskHelper {

        constructor() {}

        startSyncing() {
            settingsHelper.getApplicationSettings()
                .then(result => {
                    if(result && result.chainOfCustidy
                        && result.chainOfCustidy.authenticationToken
                        && result.chainOfCustidy.chainOfCustodyUrl) {
                        console.info('Chain of Custody data will be synced roughly every ' + config.syncDataIntervalInMillis + ' milliseconds');
                        this.syncMessages(result.chainOfCustidy.authenticationToken, result.chainOfCustidy.chainOfCustodyUrl);
                    }
                })
                .catch(err => {
                    console.error("Application Settings can't be read: " + err);
                });
        }

        syncMessages(authenticationToken, chainOfCustodyUrl) {
            if(syncing) {
                return;
            }
            syncing = true;

            if(pendingResets.length > 0) {
                this.makeResetRequest().then(result => {
                    syncing = false;
                    this.syncMessages(authenticationToken, chainOfCustodyUrl);
                });
            }
            else {
                this.makeConsumeRequest(authenticationToken, chainOfCustodyUrl).then(result => {
                    syncing = false;

                    if(result.transactionMessages.length) {
                        receiveTransactionsTask.insertMessages(result.transactionMessages);
                    }

                    let lastSyncTimeInMillis = receiveTransactionsTask.insertOrUpdateSettings(authenticationToken, chainOfCustodyUrl);
                    if(result.hasMorePages || pendingResets.length > 0) {
                        setTimeout(() => {
                            this.syncMessages(authenticationToken, chainOfCustodyUrl);
                        }, 1000);
                    }
                    else {
                        setTimeout(() => {
                            this.syncMessages(authenticationToken, chainOfCustodyUrl);
                        }, config.syncDataIntervalInMillis);
                    }
                }).catch(err => {
                    syncing = false;
                    console.log('Encountered error: ' + err);

                    // Try again on the next sync interval.
                    setTimeout(() => {
                        this.syncMessages(authenticationToken, chainOfCustodyUrl);
                    }, config.syncDataIntervalInMillis);
                });
            }
        }

        makeConsumeRequest(authenticationToken, chainOfCustodyUrl) {
            return fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/consume?limitInKb=1024'), {
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
                if(!result) {
                    throw new Error("Response was empty");
                }
                if(!result.transactionMessages) {
                    throw new Error("Response was not successful: " + JSON.stringify(result));
                }

                console.log('Received ' + result.transactionMessages.length + ' messages');
                return result;
            });
        }

        makeResetRequest() {
            const request = pendingResets.pop();

            let baseUrl = request.chainOfCustodyUrl + '/oms/rest/backchain/v1/reset';
            let url;
            if(request.fromDate) {
                let dateAsString = moment(new Date(parseInt(request.fromDate, 10))).format('YYYYMMDD');
                url = backChainUtil.returnValidURL(baseUrl + '?fromDate=' + dateAsString);
                console.log('Sync from date: ' + dateAsString);
            }
            else if(request.fromSequence) {
                url = backChainUtil.returnValidURL(baseUrl + '?fromSequence=' + request.fromSequence + '&toSequence=' + request.toSequence);
                console.log('Sync gap: ' + request.fromSequence + (request.toSequence ? (" - " + request.toSequence) : ""));
            }
            else {
                return new Promise(resolve => resolve({ success: true }));
            }

            return fetch(url, {
                method: 'get',
                headers: new Headers({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'token ' + request.authenticationToken
                })
            }).then(response => {
                return response.json();
            }).then(result => {
                if(!result) {
                    throw new Error("Response was empty");
                }
                if(!result.success) {
                    throw new Error("Request was not successful: " + JSON.stringify(result));
                }

                return this.updateChainOfCustody(request.authenticationToken, request.chainOfCustodyUrl, result.entName, result => {
                    if(!result) {
                        throw new Error("Response was empty");
                    }
                    if(!result.chainOfCustidy) {
                        throw new Error("Request was not successful: " + JSON.stringify(result));
                    }

                    result.chainOfCustidy.success = true;
                    if (request.callback) {
                        request.callback(null, result.chainOfCustidy);
                    }
                });
            }).catch(function (err) {
                console.log(err);
                if (request.callback) {
                    request.callback(err, null);
                }
            });
        }

        startSyncFromCertainDate(authenticationToken, fromDate, chainOfCustodyUrl, callback) {
            // TODO: don't add duplicates
            pendingResets.unshift({
                authenticationToken: authenticationToken,
                chainOfCustodyUrl: chainOfCustodyUrl,
                fromDate: fromDate,
                callback: callback
            });
            this.syncMessages(authenticationToken, chainOfCustodyUrl);
        }

        startGapSync(authenticationToken, chainOfCustodyUrl, gaps, callback) {
            // TODO: don't add duplicates
            for(let i = 0; i < gaps.length; i++) {
                pendingResets.unshift({
                    authenticationToken: authenticationToken,
                    chainOfCustodyUrl: chainOfCustodyUrl,
                    fromSequence: gaps[i].fromSequenceNo,
                    toSequence: gaps[i].toSequenceNo,

                    // UI shouldn't wait for all the gap sync requests to return with a response.
                    callback: i == 0 ? callback : null
                });
            }
            this.syncMessages(authenticationToken, chainOfCustodyUrl);
        }

        updateChainOfCustody(authenticationToken, chainOfCustodyUrl, entName, callback) {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, result) {
                if (err) {
                    logger.error(err);
                }

                if (result) {
                    result.chainOfCustidy = {
                        "authenticationToken": authenticationToken,
                        "lastSyncTimeInMillis": new Date().getTime(),
                        "chainOfCustodyUrl": chainOfCustodyUrl,
                        "enterpriseName": entName
                    }

                    let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({}, {$set: result}).then(resultSet => {
                        if (resultSet.modifiedCount > 0) {
                            console.log("Settings updated successfully");
                            result.success = true;
                            if (callback) {
                                callback(result);
                            }
                        }
                    })
                    .catch((err) => {
                        console.error("Error occurred while updating Settings." + err);
                        if (callback) {
                            callback({ success: false });
                        }
                    });
                }
                else if (callback) {
                    callback({ success: false });
                }
            });
        }

        getLastestSyncedDate(callback) {
            let result = dbconnectionManager.getConnection().collection('Settings').findOne({type: 'applicationSettings'}).then((result) => {
                    if (result && result.chainOfCustidy) {
                        callback(null, result.chainOfCustidy.lastSyncTimeInMillis);
                    }
                })
                .catch((err) => {
                    console.error("Error occurred while fetching LastSyncedDate." + err);
                    callback(err, null);
                });
        }

        setLastSyncedDate(lastSyncedDateInMillis) {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, result) {
                if (err) {
                    logger.error(err);
                }
                if(result) {
                    result.chainOfCustidy.lastSyncTimeInMillis = lastSyncedDateInMillis;
                    let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({type: 'applicationSettings'}, {$set:result}).then((result) => {
                        if (resultSet.modifiedCount > 0) {
                            console.log("lastSyncedDateInMillis updated successfully ");
                        }
                    })
                    .catch((err) => {
                        console.error("Error occurred while updating LastSyncedDate." + err);
                    });
                }
			})
        }

        isInitialSyncDone(callback) {
            dbconnectionManager.getConnection().collection('Settings').findOne({type: 'applicationSettings'}).then((result) => {
                if (result && result.chainOfCustidy && result.chainOfCustidy.lastSyncTimeInMillis) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            })
            .catch((err) => {
                console.error("Error occurred in isInitialSyncDone " + err);
                callback(err, false);
            });
        }
    }

export const syncTransactionTaskHelper = new SyncTransactionTaskHelper();
