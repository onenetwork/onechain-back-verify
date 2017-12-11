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
            let params = {'date': dateAsString};
            console.log('sync start date: ' + dateAsString);
            
            fetch(backChainUtil.returnValidURL(chainOfCustodyUrl + '/oms/rest/backchain/v1/reset'), {
                method: 'post',
                headers: new Headers({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + new Buffer('ProgressiveRetailerVCAdmin' + ':' + 'password').toString('base64')
                }),
                body: requestHelper.jsonToUrlParams(params)
            }).then(function(response) {
                return response.json();
            }).then(function(result) {
                me.updatechainOfCustody(authenticationToken, chainOfCustodyUrl, function(chainOfCustidy) {
                    chainOfCustidy.success = 'success';
                    callback(null, chainOfCustidy);
                });
            }).catch(function (err) {
                console.log(err);
                callback(err, null)
            });
        }
        updatechainOfCustody(authenticationToken, chainOfCustodyUrl, callback) {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, result) {
                if (err) {
                    logger.error(err);
                }
                if (result) {
                    result.chainOfCustidy = {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis" : new Date().getTime(),
                        "chainOfCustodyUrl" : chainOfCustodyUrl
                    }
                    
                    let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({}, result).then((resultSet) => {
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
                    let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({type: 'applicationSettings'}, result).then((result) => {
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