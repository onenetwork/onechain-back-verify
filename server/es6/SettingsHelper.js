import { dbconnectionManager } from './DBConnectionManager';

class SettingsHelper {

    constructor() { }

    getApplicationSettings() {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' })
                .then(function (result) {
                    if (result) {
                        resolve(result);
                    } else {
                        reject("Couldn't fetch the value");
                    }
                });
        });
    }

    getSyncStatisticsInfo() {
        return new Promise((resolve, reject) => {
            const connection = dbconnectionManager.getConnection();
            connection.listCollections({
                name: 'SyncStatistics'
            })
            .next(function(err, collinfo) {
                if (collinfo) {
                    connection.collection('SyncStatistics').findOne({})
                    .then(function (result) {
                        if (result) {
                            resolve({syncStatisticsExists:true, gapExists: result.gaps.length > 0 ? true : false });
                        } else {
                            reject("Couldn't fetch SyncStatistics value");
                        }
                    });
                } else {
                    resolve({syncStatisticsExists:false});
                }
            });
        });
    }

}

export const settingsHelper = new SettingsHelper();