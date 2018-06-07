import { dbconnectionManager } from './DBConnectionManager';
import {BigNumber} from 'bignumber.js';
import moment from 'moment';

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
        const me = this;
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
                            let sortedGaps = (result.gaps).sort(me.sortGapsByFromSequenceNo);
                            result.gaps = sortedGaps;
                            resolve({
                                syncStatistics : result,
                                syncStatisticsExists:true
                            });
                        } else {
                            resolve({syncStatisticsExists:false});
                        }
                    });
                } else {
                    resolve({syncStatisticsExists:false});
                }
            });
        });
    }

    sortGapsByFromSequenceNo(firstGapObj, secondGapObj) {
        return new BigNumber(firstGapObj.fromSequenceNo).minus(new BigNumber(secondGapObj.fromSequenceNo));
    }

    prepareStatisticsReportDataForUI(store) {
        let earliestSyncSequenceNo = store.syncStatistics.earliestSyncSequenceNo;
        let latestSyncSequenceNo = store.syncStatistics.latestSyncSequenceNo;
        let earliestSyncDateInMillis = store.syncStatistics.earliestSyncDateInMillis;
        let latestSyncDateInMillis = store.syncStatistics.latestSyncDateInMillis;
        
        store.syncStatisticsReport.clear();

        if(store.syncStatistics.gaps.length >0) {
            for(let i = 0; i < store.syncStatistics.gaps.length; i++) {
                let gap = store.syncStatistics.gaps[i];
                let gapFromSequenceNo = gap.fromSequenceNo;
                let gapToSequenceNo = gap.toSequenceNo;
                let sequenceNoDiff = (new BigNumber(gapFromSequenceNo).minus(new BigNumber(earliestSyncSequenceNo)));
                if(sequenceNoDiff.isGreaterThan(new BigNumber(0))) {
                    store.syncStatisticsReport.push({
                        type : "fullSync", 
                        syncMsg : 'Full Sync', 
                        fromSeqNo : earliestSyncSequenceNo,
                        toSeqNo : gapFromSequenceNo,
                        fromDate : moment(new Date(earliestSyncDateInMillis)).format('MMM DD,YYYY HH:mm A'),
                        toDate : moment(new Date(gap.fromDateInMillis)).format('MMM DD,YYYY HH:mm A')
                    });
                } 
                
                let numberOfMissingRecordsInTheGap = ((new BigNumber(gapToSequenceNo).minus(new BigNumber(gapFromSequenceNo))).minus(new BigNumber(1))).valueOf();
                let fromGapDate = gap.fromDateInMillis;
                let toGapDate = gap.toDateInMillis;
                let hrs = this.returnDiffInHrsMins(fromGapDate, toGapDate).hours + 'hrs';
                let mins = this.returnDiffInHrsMins(fromGapDate, toGapDate).mins + 'mins';

                store.syncStatisticsReport.push({
                    type : "gap", 
                    syncMsg : 'Sequence Gap', 
                    fromSeqNo : (new BigNumber(gap.fromSequenceNo).plus(new BigNumber(1))), 
                    toSeqNo : (new BigNumber(gap.toSequenceNo).minus(new BigNumber(1))), 
                    noOfMissingRecords : numberOfMissingRecordsInTheGap,
                    time: hrs + ' ' + mins, 
                    fromDate : moment(new Date(fromGapDate)).format('MMM DD,YYYY HH:mm A'), 
                    toDate : moment(new Date(toGapDate)).format('MMM DD,YYYY HH:mm A')
                });

                earliestSyncSequenceNo = (new BigNumber(gapToSequenceNo)).valueOf();
                earliestSyncDateInMillis = gap.toDateInMillis;

                if(i+1 == store.syncStatistics.gaps.length) {
                    if(new BigNumber(latestSyncSequenceNo).isGreaterThanOrEqualTo(new BigNumber(gapToSequenceNo))) {
                        store.syncStatisticsReport.push({
                            type : "fullSync", 
                            syncMsg : 'Full Sync', 
                            fromSeqNo : earliestSyncSequenceNo, 
                            toSeqNo : latestSyncSequenceNo, 
                            fromDate : moment(new Date(earliestSyncDateInMillis)).format('MMM DD,YYYY HH:mm A'),
                            toDate : moment(new Date(latestSyncDateInMillis)).format('MMM DD,YYYY HH:mm A')
                        });
                    }
                }
            }
        } else {
            let syncReport = {
                type : 'fullSync', 
                syncMsg : 'Full Sync', 
                fromDate : moment(new Date(earliestSyncDateInMillis)).format('MMM DD,YYYY HH:mm A'), 
                toDate : moment(new Date(latestSyncDateInMillis)).format('MMM DD,YYYY HH:mm A'), 
                fromSeqNo : earliestSyncSequenceNo, 
                toSeqNo : latestSyncSequenceNo, 
                noOfMissingRecords : 0
            };
            store.syncStatisticsReport.push(syncReport);
        }
    }

    returnDiffInHrsMins(toMillis, fromMillis) {
        let minDiff = (toMillis - fromMillis)/60000;
        if (minDiff < 0) {
            minDiff *= -1;
        }
        const hours = Math.floor(minDiff/60);
        const mins =  Math.floor(minDiff%60);
        return {hours: hours, mins: mins};
    }

    modifySyncStatsObject(syncStatistics, transMessage) { 
        if(syncStatistics.earliestSyncSequenceNo == null) {
            syncStatistics.earliestSyncSequenceNo = transMessage.sequence;
        } else if(syncStatistics.earliestSyncSequenceNo > transMessage.sequence) {
            //If the difference is 1, there's no need to add a gap. We just received and earlier sequence
            if(syncStatistics.earliestSyncSequenceNo - transMessage.sequence > 1) {
                this.modifyGap(syncStatistics, transMessage, "earlier");
            }
            syncStatistics.earliestSyncSequenceNo = transMessage.sequence;
        }
        if(syncStatistics.latestSyncSequenceNo == null) {
            syncStatistics.latestSyncSequenceNo = transMessage.sequence;
        } else if(syncStatistics.latestSyncSequenceNo < transMessage.sequence) {
            //If the difference is 1, there's no need to add a gap. We just received and earlier sequence
            if(transMessage.sequence - syncStatistics.latestSyncSequenceNo > 1) {
                this.modifyGap(syncStatistics, transMessage, "later");
            }
            syncStatistics.latestSyncSequenceNo = transMessage.sequence;
        }

        if(syncStatistics.earliestSyncSequenceNo < transMessage.sequence &&
            transMessage.sequence < syncStatistics.latestSyncSequenceNo) {
            this.modifyGap(syncStatistics, transMessage, "between");
        }

        if (syncStatistics.earliestSyncDateInMillis == null ||
             syncStatistics.earliestSyncDateInMillis > transMessage.date) {
             syncStatistics.earliestSyncDateInMillis = transMessage.date;
        }
        if (syncStatistics.latestSyncDateInMillis == null ||
             syncStatistics.latestSyncDateInMillis < transMessage.date) {
             syncStatistics.latestSyncDateInMillis = transMessage.date;
         }
    }

    /**
     * Will add a new gap or update an existing one depending on the parameters
     * @param {*} syncStatistics 
     * @param {*} transMessage 
     * @param {*} where could earlier, later, between. It isn't optional.
     */
    modifyGap(syncStatistics, transMessage, where) {
        if(where == 'earlier') {
            syncStatistics.gaps.push({
                fromSequenceNo: transMessage.sequence,
                fromDateInMillis: transMessage.date,
                toSequenceNo: syncStatistics.earliestSyncSequenceNo,
                toDateInMillis: syncStatistics.earliestSyncDateInMillis   
            });
        } else if(where == 'later') {
            syncStatistics.gaps.push({
                fromSequenceNo: syncStatistics.latestSyncSequenceNo,
                fromDateInMillis: syncStatistics.latestSyncDateInMillis,
                toSequenceNo: transMessage.sequence,
                toDateInMillis: transMessage.date   
            });
        } else if(where == 'between') {
            let removeGapIndex = -1;
            for(let i=0; i < syncStatistics.gaps.length; i++) {
                let gap = syncStatistics.gaps[i];
                if(gap.fromSequenceNo < transMessage.sequence && transMessage.sequence < gap.toSequenceNo) {
                    if(gap.toSequenceNo - gap.fromSequenceNo == 2) {
                        removeGapIndex = i;
                        break;
                    } else if(gap.toSequenceNo - transMessage.sequence == 1) {
                        gap.toSequenceNo = transMessage.sequence;
                        gap.toDateInMillis = transMessage.date;
                    } else if(transMessage.sequence - gap.fromSequenceNo == 1) {
                        gap.fromSequenceNo = transMessage.sequence;
                        gap.fromDateInMillis = transMessage.date;
                    } else {
                        //Split the gap in half
                        let gap1 = {
                            fromSequenceNo : gap.fromSequenceNo,
                            fromDateInMillis : gap.fromDateInMillis,
                            toSequenceNo: transMessage.sequence,
                            toDateInMillis : transMessage.date
                        };
                        let gap2 = {
                            fromSequenceNo : transMessage.sequence,
                            fromDateInMillis : transMessage.date,
                            toSequenceNo: gap.toSequenceNo,
                            toDateInMillis : gap.toDateInMillis
                        };
                        syncStatistics.gaps.push(gap1);
                        syncStatistics.gaps.push(gap2);
                        removeGapIndex = i;
                    }
                }
            }
            if(removeGapIndex != -1) {
                syncStatistics.gaps.splice(removeGapIndex, 1);
            }
        }
    }

    updateSyncStatistics(syncStatistics) {
        dbconnectionManager.getConnection().collection('SyncStatistics')
        .update({}, {$set: syncStatistics}, { upsert: true })
        .then((resultSet) => {
            if (resultSet.result.mModifiedCount > 0) {
                console.log("Sync Statistics have been updated successfully.");
            }
        })
        .catch((err) => {
            console.error("Error occurred while updating SyncStatistics." + err);
        });
    }

}

export const settingsHelper = new SettingsHelper();