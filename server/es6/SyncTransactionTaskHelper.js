import {dbconnectionManager} from './DBConnectionManager';
import moment from 'moment';
import {requestHelper} from './RequestHelper';
import {backChainUtil} from  './BackChainUtil';
import "isomorphic-fetch";

/*
 Helper class contains synch related APIs
*/
class SyncTransactionTaskHelper {

        constructor() {}

        startSyncFromCertainDate(authenticationToken, startFromDate, chainOfCustodyUrl, callback) {
            let me = this;
            let dateAsString = moment(new Date(parseInt(startFromDate,10))).format('YYYYMMDD');
            console.log('sync start date: ' + dateAsString);

            fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/reset?fromDate=' + dateAsString), {
                method: 'get',
                headers: new Headers({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'token ' + authenticationToken
                })
            }).then(function(response) {
                return response.json();
            }).then(function(result) {
                me.updatechainOfCustody(authenticationToken, chainOfCustodyUrl,result.entName, function(chainOfCustidy) {
                    chainOfCustidy.success = 'success';
                    callback(null, chainOfCustidy);
                });
            }).catch(function (err) {
                console.log(err);
                callback(err, null)
            });
        }
        startGapSync(authenticationToken, chainOfCustodyUrl, gaps, callback) {
            /**
             * Callback is called after the first successful attempt or error attempt. 
             * UI shouldn't wait for all the gap reset requests to return with a response.
             */
            let me = this;
            for(let i=0, len = gaps.length; i < len ; i++) {
                let gap = gaps[i];
                fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/reset?fromSequence=' + gap.fromSequenceNo + '&toSequence=' + gap.toSequenceNo), {
                    method: 'get',
                    headers: new Headers({
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'token ' + authenticationToken
                    })
                }).then(function(response) {
                    return response.json();
                }).then(function(result) {
                    me.updatechainOfCustody(authenticationToken, chainOfCustodyUrl,result.entName, function(chainOfCustidy) {
                        chainOfCustidy.success = 'success';
                        callback(null, chainOfCustidy);
                        callback = function() {};
                    });
                }).catch(function (err) {
                    callback(err, null);
                    callback = function() {}; //replace with empty function to prevent subsequent calls
                });
            }
        }
        updatechainOfCustody(authenticationToken, chainOfCustodyUrl,entName, callback) {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, result) {
                if (err) {
                    logger.error(err);
                }
                if (result) {
                    result.chainOfCustidy = {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis" : new Date().getTime(),
                        "chainOfCustodyUrl" : chainOfCustodyUrl,
                        "enterpriseName":entName
                    }

                    let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({}, {$set: result}).then((resultSet) => {
                    if (resultSet.modifiedCount > 0) {
                            console.log("Settings updated successfully ");
                            callback(result.chainOfCustidy);
                        }
                    })
                    .catch((err) => {
                        console.error("Error occurred while updating Settings." + err);
                    });
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
