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
    @observable gapExists = false;
    @observable noOfGaps = 0;
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
    @observable businessTransactionIds = [];
    @observable enterpriseBusinessTransactions = [];
    @observable intersectionBusinessTransactions = [];
    sliceDataProvidedByAPI = false;

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

    @computed get oneBcClient() {
        if (this.blockChainUrl != null && this.blockChainContractAddress != null) {
            return oneBcClient.createContentBcClient({
                blockchain: 'eth',
                url: this.blockChainUrl,
                contractAddress: this.blockChainContractAddress,
                disputeContractAddress: this.disputeBlockChainContractAddress
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

    /**
     * Putting @computed listBusinessTransactionIds setter after listBusinessTransactionIds getter is recomended.
     */
    @computed get listBusinessTransactionIds() {
        return this.businessTransactionIds;
    }

    set listBusinessTransactionIds(businessTransactionId) {
        this.businessTransactionIds.splice(0, this.businessTransactionIds.length);

        /*TODO@Pankaj remove below lines*/
        this.enterpriseBusinessTransactions.splice(0, this.enterpriseBusinessTransactions.length);
        this.intersectionBusinessTransactions.splice(0, this.intersectionBusinessTransactions.length);

        /*TODO@Pankaj enable below lines*/
        // this.enterpriseBusinessTransactions = this.viewTransactions.enterprise.transactionSlice.businessTransactions;
        // this.intersectionBusinessTransactions = this.viewTransactions.intersection.transactionSlice.businessTransactions;


        /*TODO@Pankaj remove below for loop don't know why i am getting btransaction as stirng*/
        for(let i = 0; i < this.viewTransactions.enterprise.transactionSlice.businessTransactions.length; i++) {
            let enterpriseBusinessTransaction = this.viewTransactions.enterprise.transactionSlice.businessTransactions[i];
            //TODO@PANKAJ temp fix don't know why i am getting btransaction as stirng
            if(typeof enterpriseBusinessTransaction==='string') {
                enterpriseBusinessTransaction = JSON.parse(enterpriseBusinessTransaction)
            }
            this.enterpriseBusinessTransactions.push(enterpriseBusinessTransaction);
        }

        /*TODO@Pankaj remove below for with if, don't know why i am getting btransaction as stirng */
        if(this.viewTransactions.intersection) {
            for(let i = 0; i < this.viewTransactions.intersection.transactionSlice.businessTransactions.length; i++) {
                let intersectioneBusinessTransaction = this.viewTransactions.intersection.transactionSlice.businessTransactions[i];
                //TODO@PANKAJ temp fix don't know why i am getting btransaction as stirng
                if(typeof intersectioneBusinessTransaction==='string') {
                    intersectioneBusinessTransaction = JSON.parse(intersectioneBusinessTransaction)
                }
                this.intersectionBusinessTransactions.push(intersectioneBusinessTransaction);
            }
        }

        for(let i = 0; i < this.enterpriseBusinessTransactions.length; i++) {
            let enterpriseBusinessTransaction = this.enterpriseBusinessTransactions[i];

            //TODO@PANKAJ temp fix don't know why out of three transaction other two transactions are of type String
            if(typeof enterpriseBusinessTransaction==='string') {
                enterpriseBusinessTransaction = JSON.parse(enterpriseBusinessTransaction)
            }

            this.businessTransactionIds.push(enterpriseBusinessTransaction.btid);
        }
        
        if(businessTransactionId) {
            for (let i = this.businessTransactionIds.length-1; i >= 0; i--) {
                if(!((this.businessTransactionIds[i].toString()).match(businessTransactionId))) {
                    this.businessTransactionIds.splice(i, 1);
                    this.enterpriseBusinessTransactions.splice(i, 1);
                    this.intersectionBusinessTransactions.splice(i, 1);
                }
            }
        }
    }

    @computed get listEnterpriseBusinessTransactions() {
        return this.enterpriseBusinessTransactions;
    }

    @computed get listIntersectionBusinessTransactions() {
        return this.intersectionBusinessTransactions;
    }
}
export const backChainStore = new BackChainStore();
