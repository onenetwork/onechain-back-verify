import { settingsHelper } from './SettingsHelper';
import { disputeHelper } from './DisputeHelper';
import moment from 'moment'


class DisputeOrganizerTaskHelper {

    disputeOrganizerTask() {
        console.log("Deleting old disputes");
        this.deleteOldDisputes();
    }

    submitDisputeWindowVisible(date) {
        return new Promise((resolve, reject) => {
            settingsHelper.getApplicationSettings()
            .then(result => {
                if (result && result.blockChain.disputeSubmissionWindowInMinutes) {
                        let disputeSubmissionWindowInMinutes = result.blockChain.disputeSubmissionWindowInMinutes;
                        let duration = moment.duration(moment(new Date()).diff(moment(new Date(date))));
                        let durationInMinutes = Math.ceil(duration.asMinutes());
                        resolve(durationInMinutes < disputeSubmissionWindowInMinutes);
                    } else {
                        resolve(true);
                    }
                })
                .catch(err => {
                    console.error("submitDisputeWindowVisible err: " + err);
                    reject(err);
                });
        });
    }

    deleteOldDisputes() {
        let me = this;
        disputeHelper.getDisputes()
            .then(function (result) {
                let dispute = null;
                for (let i = 0, len = result.length; i < len; i++) {
                    dispute = result[i];
                    if (dispute.transaction) {
                        me.submitDisputeWindowVisible(dispute.transaction.date)
                        .then((resutl)=>{
                            if(resutl) {
                                disputeHelper.discardDraftDispute(dispute.id)
                                .then(function (result) {
                                    if (result.sucess) {
                                        console.log("Old disputes deleted successfully.");
                                    }
                                })
                            }
                        })
                    }
                }
            })
            .catch(function (error) {
                console.log("Some error occured while deleting old disputes " + error);
            });
    }
}

setTimeout(() => {
    disputeOrganizerTaskHelper.disputeOrganizerTask();
}, 1000 * 60 * 5);

export const disputeOrganizerTaskHelper = new DisputeOrganizerTaskHelper();