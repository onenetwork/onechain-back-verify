import crypto from 'crypto';
import { settingsHelper } from './SettingsHelper';

class BlockChainVerifier {

    generateHash(jsonString) {
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    verifyHash(hash, oneBcClient) {
        if(hash.indexOf('0x') != 0) hash = '0x' + hash;
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                oneBcClient.verify(hash).then(function (verified) {
                    if (verified) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(function (error) {
                    reject("Verification failed");
                });
            }
        });
    }

    /**
     * Recieves list of Disputes from BackChain
     * @param {*} filters - an object containing selected filters from Disputes UI
     * @param {*} oneBcClient - instance of @onenetwork/one-backchain-client
     */
    getDisputes(filters, oneBcClient) {

        //Return a promise and resolve it once we get the values from the server
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                //oneBcClient will be utilized once the api is completed   
            }
            let listofDisputes = [];
            let dispute = {
                "id": 1234569,
                "creationDate": null, 
                "submittedDate" : 1522108391111, 
                "closedDate": null, 
                "transactionId": 323223947388,
                "events" : [9868367292, 5769927272], 
                "raisedBy": "0x69bc764651de75758c489372c694a39aa890f911ba5379caadc08f44f8173051", 
                "reasonCode": "Entered wrong data",
                "status": "Open"
            };
            if(filters.transactionId) {
                dispute.transactionId = filter.transactionId;
            }
            listofDisputes(dispute);
            resolve(listofDisputes);
        });                
    }

    /**
     * Filters supported:
     * raisedBy
     * transactionId
     * @param {*} filters an object containing subset of the filters from Disputes UI
     * @param {*} oneBcClient - instance of @onenetwork/one-backchain-client
     */
    getDisputeSummary(filters, oneBcClient) {
        //Return a promise and resolve it once we get the values from the server
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                //oneBcClient will be utilized once the api is completed
            }
            resolve({
                openCount: 4
            });
        }); 
    }


    /**
     * Sends dispute to block chain using backchain client apis. 
     *
     * @param {*} dispute - dispute object to be submmitted
     * @param {*} oneBcClient - instance of @onenetwork/one-backchain-client
     */
    submitDispute(dispute, oneBcClient) {
        //Return a promise and resolve it once we get the values from the server
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                //oneBcClient will be utilized once the api is completed   
                resolve(dispute); //We'll determine what to return later.
            } else {
                reject("BlockChain Client instance doesn't exist.");
            }
            
        });  
    }

    /**
     * Closes a dispute in backchain with given id. 
     * 
     * @param {*} disputeId - id of the disputes to be closed
     * @param {*} oneBcClient - instance of @onenetwork/one-backchain-client
     */
    closeDispute(disputeId, oneBcClient) {
        //Return a promise and resolve it once we get the values from the server
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                //oneBcClient will be utilized once the api is completed   
                resolve({success:true, disputeId: disputeId}); //We'll determine what to return later.
            } else {
                reject("BlockChain Client instance doesn't exist.");
            }
            
        });  
    }
}

export const blockChainVerifier = new BlockChainVerifier();
