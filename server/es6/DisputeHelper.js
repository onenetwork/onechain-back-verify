import { dbconnectionManager } from './DBConnectionManager';
import { blockChainVerifier } from './BlockChainVerifier';
import { observable } from 'mobx';
import { Long } from 'mongodb';

class DisputeHelper {

    constructor() { }

    getDisputes(filters) {
        //filters will be an object including all the selected filters in the UI, like transactionId,raisedBy etc.
        //Draft records will come from the db and Open/Closed ones will be fetched using oneBcClient apis
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').find()
                .sort({ creationDate: -1 })
                .toArray(function (err, result) {
                    if (err) {
                        console.error("Error occurred while fetching transations by sequencenos." + err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
        });
    }

    getOpenDisputeCount(transactionId) {
        return new Promise((resolve, reject) => {
            resolve(Math.floor(Math.random() * 3) + 1);
        });
    }

    getDraftCount() {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('DraftDisputes').count()
                .then((count) => {
                    resolve(count);
                })
                .catch((err) => {
                    console.error("Error occurred while fetching draft count." + err);
                    reject(err);
                });;
        })
    }
}

export const disputeHelper = new DisputeHelper();
