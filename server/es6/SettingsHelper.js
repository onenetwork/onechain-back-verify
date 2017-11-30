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

}

export const settingsHelper = new SettingsHelper();