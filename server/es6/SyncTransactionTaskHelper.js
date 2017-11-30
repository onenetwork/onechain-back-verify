import {dbconnectionManager} from './DBConnectionManager';
import moment from 'moment';

/*
 Helper class contains synch related APIs
*/
class SyncTransactionTaskHelper {
    
        constructor() {}
    
        startSyncFromCertainDate(authenticationToken, startFromDate) {
            /**
             * - Backchain app does a one-time call to:
                https://platform/oms/rest/backchain/v1/reset?date=20170801
                - PLT populates kafka from the given PIT with all relevant ent & intersection slices starting at given date
             */
            //fetch by itself return promise so once the actual code is in place, go ahead and remove the promise and return what fetch returns
            return new Promise((resolve, reject) => {
                //Pseudo code
                /**
                 * let dateAsString = format(startFromDate, 'YYYYmmdd');
                 * fetch(resetUrl, {method: 'POST'}).//pass the param in the body
                 * .then() //handle success
                 * .catch() //handle error
                 */
                let dateAsString = moment(new Date(parseInt(startFromDate,10))).format('YYYYmmdd');
                console.log('sync start date: ' + dateAsString);
                let result = this.kafkaTest();
                if(result) {
                    this.updatechainOfCustody(authenticationToken, function(chainOfCustidy) {
                        chainOfCustidy.success = 'success';
                        resolve(chainOfCustidy);
                    });
                } else {
                    reject();
                }
            }); 
        }
        updatechainOfCustody(authenticationToken, callback) {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' }, function (err, result) {
                if (err) {
                    logger.error(err);
                }
                if (result) {
                    result.chainOfCustidy = {
                        "authenticationToken" : authenticationToken,
                        "lastSyncTimeInMillis" : new Date().getTime()
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

        //kafka test function
        kafkaTest() {
         return true;   
        }
    }

export const syncTransactionTaskHelper = new SyncTransactionTaskHelper();