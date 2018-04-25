import { settingsHelper } from './SettingsHelper';
import { disputeHelper } from './DisputeHelper';
import {backChainUtil} from  './BackChainUtil';
import {dbconnectionManager} from './DBConnectionManager';
import moment from 'moment'


class DisputeOrganizerTaskHelper {

    disputeOrganizerTask() {
        console.log("Deleting old disputes && getting ent address !!");
        settingsHelper.getApplicationSettings()
            .then(result => {
                this.deleteOldDisputes(result);
                this.getEnterpriseAddress(result);
            })
            .catch(err => {
                console.error("submitDisputeWindowVisibleForTnx err: " + err);
                reject(err);
            });
    }

    submitDisputeWindowVisibleForTnx(transaction, settings) {
        return new Promise((resolve, reject) => {
            if (settings && settings.blockChain.disputeSubmissionWindowInMinutes) {
                    let disputeSubmissionWindowInMinutes = settings.blockChain.disputeSubmissionWindowInMinutes;
                    let duration = moment.duration(moment(new Date()).diff(moment(new Date(transaction.date))));
                    let durationInMinutes = Math.ceil(duration.asMinutes());
                    resolve(durationInMinutes > disputeSubmissionWindowInMinutes);
                } else {
                    resolve(true);
                }
        });
    }

    getEnterpriseAddress(settings) {
        if(settings && settings.chainOfCustidy && settings.chainOfCustidy.authenticationToken && settings.chainOfCustidy.chainOfCustodyUrl) {
            fetch(backChainUtil.returnValidURL(settings.chainOfCustidy.chainOfCustodyUrl + '/oms/rest/backchain/v1/addresses'), {
                method: 'get',
                headers: new Headers({
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'token ' + settings.chainOfCustidy.authenticationToken
                })
            }).then(response => {
                return response.json();
            }).then(result => {
                if(!result) {
                    throw new Error("registerAddress response was empty");
                }
                if(result.length > 0) {
                    let backChainAddressMappings = {};
                    for(let i = 0; i < result.length; i++) {
                        Object.assign(backChainAddressMappings, result[i]);
                    }
                    this.writeBackChainAddressMapping(backChainAddressMappings);
                }
            });
        }
    }

    writeBackChainAddressMapping(backChainAddressMappings) {
        return new Promise((resolve, reject) => {
            dbconnectionManager.getConnection().collection('BackChainAddressMapping').update({}, backChainAddressMappings, { upsert: true })
            .then(() => {
                console.info("BackChainAddressMapping written successfully !");
                resolve({success: true});
            })
            .catch((err) => {
                console.error("Error occurred while writing BackChainAddressMapping: " + err);
                reject(err);
            });
        });
    }

    deleteOldDisputes(settings) {
        let me = this;
        disputeHelper.getDisputes()
            .then(function (result) {
                let dispute = null;
                for (let i = 0, len = result.length; i < len; i++) {
                    dispute = result[i];
                    if (dispute.transaction) {
                        me.submitDisputeWindowVisibleForTnx(dispute.transaction, settings)
                        .then((result)=>{
                            if(result) {
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

setInterval(() => {
    disputeOrganizerTaskHelper.disputeOrganizerTask();
}, 1000 * 60 * 5);

export const disputeOrganizerTaskHelper = new DisputeOrganizerTaskHelper();