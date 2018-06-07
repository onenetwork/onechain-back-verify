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
    @observable blockChainUrl = null;
    @observable blockChainContractAddress = null;
    @observable disputeBlockChainContractAddress = null;
    @observable businessTransactionTextSearch = null;
    @observable entNameOfLoggedUser = null;
    @observable transactions = observable([]);
    @observable disputes = observable([]);
    @observable verifications = observable.map({});
    @observable canStartVerifying = false;
    @observable error = null;
    @observable eventsTransactionId = null;
    @observable events = observable([]);
    @observable myAndDiffViewModalActive = false;
    @observable displayMessageViewModalActive = false;
    @observable displayMessageViewModalTitle = null;
    @observable displayMessageViewModalContent = null;
    @observable payload = observable([]);
    @observable viewTransactions = observable.map({});
    @observable myAndDiffViewModalType = null;
    @observable chainOfCustodyUrl = null;
    @observable mode = null;
    @observable startSync = false;
    @observable syncStatisticsExists = false;
    @observable syncStatistics = null;
    @observable syncStatisticsReport = [];
    @observable dbSyncModalViewActive = false;
    @observable newDisputeModalActive = false;
    @observable disputeTransaction = null;
    @observable generatedDisputeId = null;
    @observable disputeSubmissionWindowInMinutes = null;
    @observable displayAlertPopup = false;
    @observable alertPopupTitle = null;
    @observable alertPopupContent = null;
    @observable alertPopupLevel = 'INFO';
    @observable backChainAccountOfLoggedUser = null;
    @observable openDisputeCountOfLoggedUser = 0;
    @observable backChainAddressMapping = {};
    @observable preSetDisputeFilters = {};
    @observable loadingData = false;

    // props modified by API
    @observable showDisputeDetailsInPopup = false;
    @observable showDisputeActions = false;
    sliceDataProvidedByAPI = false;
    disputeDataProvidedByAPI = false;

    @computed get viewsMap() {
        const myEntName = this.entNameOfLoggedUser;
        let viewsMap = {};
        /* viewsMap contains all viewnames with corresponding transaction ids */
        this.transactions.forEach(transaction => {
            if (transaction) {
                for (let j = 0; j < transaction.transactionSlices.length; j++) {
                    let transactionSlice = transaction.transactionSlices[j];
                    // myView
                    if(transactionSlice.type == "Enterprise") {
                        if(this.isInitialSyncDone == null || this.isInitialSyncDone == false) {
                            if (transactionSlice.enterprise in viewsMap) {
                                viewsMap[transactionSlice.enterprise].push(transaction.id);
                                viewsMap[transactionSlice.enterprise] = Array.from(new Set(viewsMap[transactionSlice.enterprise]));
                            }
                            else {
                                viewsMap[transactionSlice.enterprise] = [transaction.id];
                            }
                        }
                        else if (transactionSlice.enterprise == myEntName) {
                            if (myEntName in viewsMap) {
                                viewsMap[myEntName].push(transaction.id);
                                viewsMap[myEntName] = Array.from(new Set(viewsMap[myEntName]));
                            }
                            else {
                                viewsMap[myEntName] = [transaction.id];
                            }
                        }
                    }
                    // intersection
                    else if(transactionSlice.type == "Intersection") {
                        if(!this.sliceDataProvidedByAPI && !this.isInitialSyncDone) {
                            let partnerEntName = transactionSlice.enterprises[0] +" & "+ transactionSlice.enterprises[1];

                            if (partnerEntName in viewsMap) {
                                viewsMap[partnerEntName].push(transaction.id);
                                viewsMap[partnerEntName] = Array.from(new Set(viewsMap[partnerEntName]));
                            }
                            else {
                                viewsMap[partnerEntName] = [transaction.id];
                            }
                        }
                        else if (((transactionSlice.enterprises).indexOf(myEntName) > -1)) {
                            let logInUserEntIndex = (transactionSlice.enterprises).indexOf(myEntName);
                            let partnerEntName = logInUserEntIndex == 0 ? transactionSlice.enterprises[1] : transactionSlice.enterprises[0];

                            if (partnerEntName in viewsMap) {
                                viewsMap[partnerEntName].push(transaction.id);
                                viewsMap[partnerEntName] = Array.from(new Set(viewsMap[partnerEntName]));
                            }
                            else {
                                viewsMap[partnerEntName] = [transaction.id];
                            }
                        }
                    }
                }
            }
        });
        return viewsMap;
    }

    @computed get oneContentBcClient() {
        if (this.blockChainUrl != null && this.blockChainContractAddress != null) {
            return oneBcClient.createContentBcClient({
                blockchain: 'eth',
                url: this.blockChainUrl,
                contentBackchainContractAddress: this.blockChainContractAddress,
                disputeBackchainContractAddress: this.disputeBlockChainContractAddress
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
            const totalCnt = this.verifications.size;
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
