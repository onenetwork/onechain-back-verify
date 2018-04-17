import { settingsHelper } from './SettingsHelper';
import { disputeHelper } from './DisputeHelper';
import moment from 'moment'


class DisputeOrganizerTaskHelper {

    disputeOrganizerTask() {
        console.log("Deleting old disputes");
        this.deleteOldDisputes();
    }

    deleteOldDisputes() {
        settingsHelper.getApplicationSettings()
        .then(result => {
            if (result && result.blockChain.disputeSubmissionWindowInMinutes) {
                let disputeSubmissionWindowInMinutes = result.blockChain.disputeSubmissionWindowInMinutes;
                disputeHelper.getDisputes()
                    .then(function (result) {
                        let dispute = null;
                        for (let i = 0, len = result.length; i < len; i++) {
                            dispute = result[i];
                            if (dispute.transaction) {
                                let duration = moment.duration(moment(new Date()).diff(moment(new Date(dispute.transaction.date))));
                                let mins = Math.ceil(duration.asMinutes());
                                if (mins > disputeSubmissionWindowInMinutes) {
                                    disputeHelper.discardDraftDispute(dispute.id)
                                        .then(function (result) {
                                            if (result.sucess) {
                                                console.log("Old disputes deleted successfully.");
                                            }
                                        })
                                }
                            }
                        }
                    })
                    .catch(function (error) {
                        console.log("Some error occured while deleting old disputes " + error);
                    });
            }
        })
        .catch(err => {
            console.error("Application Settings can't be read: " + err);
            reject(err);
        });
    }
}

setTimeout(() => {
    disputeOrganizerTaskHelper.disputeOrganizerTask();
}, 1000 * 60 * 5);

export const disputeOrganizerTaskHelper = new DisputeOrganizerTaskHelper();