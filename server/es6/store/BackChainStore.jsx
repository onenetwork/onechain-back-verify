import { observable, computed } from 'mobx';
import oneBcClient from '@onenetwork/one-backchain-client';

class BackChainStore {
    @observable lastestSyncedDate = null;
    @observable transactionIdSearch = null;
    @observable businessTransactionIdSearch = null;
    @observable searchCriteria = null;
    @observable isInitialSyncDone = null;
    @observable isInitialSetupDone = null;
    @observable authenticationToken = null;
    @observable lastSyncTimeInMillis = null;
    @observable syncFailed = false;
    @observable syncGoingOn = false;
    @observable blockChainUrl = null;
    @observable blockChainContractAddress = null;
    @observable blockChainPrivateKey = null;
    @observable businessTransactionTextSearch = null;
    @observable entNameOfLoggedUser = "CarrierA";
    @observable transactions = observable([]);
    @observable verifications = observable.map({});
    @observable canStartVerifying = false;
    @observable error = null;
    @observable myAndDiffViewModalActive = false;
    @observable startSyncModalViewModalActive = false;
    @observable payload = observable([]);
    @observable viewTransactions = observable.map({});
    @observable myAndDiffViewModalType = null;
    @observable backChainURL = null;
    @computed get viewsMap() {
        const myEntName = this.entNameOfLoggedUser;
        let viewsMap = {};
        /* viewsMap contains all viewnames with corresponding transaction ids */
        this.transactions.forEach(transaction => {
            if (transaction) {
                for (let j = 0; j < transaction.transactionSliceObjects.length; j++) {
                    let transactionslice = transaction.transactionSliceObjects[j];

                    if (transactionslice.type == "Enterprise" && transactionslice.enterprise == myEntName) {
                        if (myEntName in viewsMap) {
                            viewsMap[myEntName].push(transaction.id);
                            viewsMap[myEntName] = Array.from(new Set(viewsMap[myEntName]));
                        } else {
                            viewsMap[myEntName] = [transaction.id];
                        }
                    }

                    if (transactionslice.type == "Intersection" && ((transactionslice.enterprises).indexOf(myEntName) > -1)) {
                        let logInUserEntIndex = (transactionslice.enterprises).indexOf(myEntName);
                        let partnerEntName = logInUserEntIndex == 0 ? transactionslice.enterprises[1] : transactionslice.enterprises[0];

                        if (partnerEntName in viewsMap) {
                            viewsMap[partnerEntName].push(transaction.id);
                            viewsMap[partnerEntName] = Array.from(new Set(viewsMap[partnerEntName]));
                        } else {
                            viewsMap[partnerEntName] = [transaction.id];
                        }
                    }
                }
            }
        });
        return viewsMap;
    }

    @computed get oneBcClient() {
        if (this.blockChainUrl != null && this.blockChainContractAddress != null && this.blockChainPrivateKey != null) {
            return oneBcClient({
                blockchain: 'eth',
                url: this.blockChainUrl,
                contractAddress: this.blockChainContractAddress,
                privateKey: this.blockChainPrivateKey
            });
        } else {
            return null;
        }
    }

    /**
     * Returns 
     * {
     *      totalCompleted: percentage of the verification process
     *      endResult: verifying, failed, succeeded
     * }
     * 
     */
    @computed get verificationStatus() {
        let totalCompleted = 0;
        let endResult = 'verifying';
        if(this.canStartVerifying) {
            let i = 0;
            const totalCnt = this.verifications.keys().length;
            let completedCnt = 0; 
            let failed = false;
            let completed = false;
            this.verifications.forEach(value => {
                if(value == 'failed') {
                    completedCnt++;
                    failed = true;
                }
                if(value == 'verified') {
                    completedCnt++;
                } 
            });
            completed = (completedCnt == totalCnt);
            if(failed) {
                endResult = 'failed';
            } else if(completed) { //none failed so all of them should be verified
                endResult = 'verified';
            }
            totalCompleted = (completedCnt / totalCnt) * 100;
        }
        return {
            "totalCompleted": totalCompleted,
            "endResult": endResult
        };
    }
}
export const backChainStore = new BackChainStore();