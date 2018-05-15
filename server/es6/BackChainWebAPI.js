import {syncTransactionTaskHelper} from './SyncTransactionTaskHelper';
import {payloadHelper} from './PayloadHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {transactionHelper} from './TransactionHelper';
import {disputeHelper} from './DisputeHelper';
import {settingsHelper} from './SettingsHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';
import { dbconnectionManager } from './DBConnectionManager';

exports.getLastestSyncedDate = function(req, res) {
    syncTransactionTaskHelper.getLastestSyncedDate(function(error, result) {
        if(error) {
            res.json({success : false});
        } else {
            res.json({
                lastestSyncedDate: result
            });
        }
    });
};

exports.isInitialSyncDone = function(req, res) {
    syncTransactionTaskHelper.isInitialSyncDone(function(error, result) {
        res.json({
            isInitialSyncDone: result
        });
    });
};


exports.getTransactionById = function(req, res) {
    let data = [];
    transactionHelper.getTransactionById(req.params.transId, function(error, result) {
        if(result !== null) {
            data.push(result);
        }
        res.json({result : data});
    });
};

exports.getTransactionByBusinessTransactionId = function(req, res) {
    transactionHelper.getTransactionByBusinessTransactionId(req.params.btId.split(','),function(error, result) {
        res.json({result : result});
    });
};

exports.getTransactionByText = function(req, res) {
    transactionHelper.getTransactionByText(req.params.searchText,function(error, result) {
        res.json({result : result});
    });
};

exports.saveBlockChainSettings = function(req, res) {
    transactionHelper.saveBlockChainSettings(req.body, function(error, result) {
        if(error) {
            res.json({success : false});
        } else {
            res.json({success : result});
        }
    });
};

exports.getApplicationSettings = function(req, res) {
    settingsHelper.getApplicationSettings()
    .then(function (result) {
        res.json({success: true, settings: result});
    })
    .catch(function (error) {
        res.json({success: false});
    });
};


exports.startSyncFromCertainDate = function(req, res) {
    syncTransactionTaskHelper.startSyncFromCertainDate(req.body.authenticationToken, req.body.startFromDate, req.body.chainOfCustodyUrl, (error, result) => {
        if(error) {
            res.json({success : false});
        } else {
            res.json(result);
        }
    });
};

exports.startGapSync = function(req, res) {
    syncTransactionTaskHelper.startGapSync(req.body.authenticationToken, req.body.chainOfCustodyUrl, JSON.parse(req.body.gaps), function(error, result) {
        if(error) {
            res.json({success : false});
        } else {
            res.json(result);
        }
    });
};

exports.getSyncStatisticsInfo = function(req, res) {
    settingsHelper.getSyncStatisticsInfo()
    .then(function (result) {
        res.json({success: true, statisticsInfo: result});
    })
    .catch(function (error) {
        res.json({success: false});
    });
}

exports.getSyncStatistics = function(req, res) {
    settingsHelper.getSyncStatistics()
    .then(function (result) {
        if(result) {
            res.json({success: true, statistics: result});
        } else {
            res.json({success: false});
        }
    })
    .catch(function (error) {
        res.json({success: false});
    });
}

exports.getTransactionsBySequenceNos = function(req, res) {
    transactionHelper.getTransactionsBySequenceNos(JSON.parse(req.params.sequenceNos))
    .then(function (result) {
        res.json({success: true, txns: result});
    })
    .catch(function (error) {
        res.json({success: false});
    });
}

exports.getEventsForTransaction = function(req, res) {
    transactionHelper.getEventsForTransaction(req.params.transId).then(events => {
        res.json({ result: events });
    });
};

exports.getTransactionSlice = function(req, res) {
    dbconnectionManager.fetchSlice(req.params.payloadId).then(slice => {
        res.json({ result: slice });
    });
};

exports.getDisputes = function(req, res) {
    disputeHelper.getDisputes(req.body)
    .then(function (result) {
        res.json({success: true, disputes: result});
    })
    .catch(function (error) {
        res.json({success: false});
    });
};

exports.getOpenDisputeCount = function (req, res) {
    let tnxId = req.params.transactionId == 'null' || req.params.transactionId == 'undefined' ? null : req.params.transactionId;
    disputeHelper.getOpenDisputeCount(tnxId)
    .then(function (result) {
        res.json({ success: true, disputeCount: result });
    })
    .catch(function (error) {
        res.json({ success: false });
    });
};

exports.saveDisputeAsDraft = function (req, res) {
    disputeHelper.saveAsDraft(JSON.parse(req.params.dispute))
    .then(function (result) {
        res.json(result);
    })
    .catch(function (error) {
        res.json({ success: false });
    });
};

exports.disputeExists = function (req, res) { 
    disputeHelper.disputeExists(req.params.transactionId)
        .then(function (result) {
            res.json({ success: result.success, exists: result.exists });
        })
        .catch(function (error) {
            res.json({ success: false });
        });
};

exports.generateDisputeId = function (req, res) {
    res.json(disputeHelper.generateDisputeId(req.params.plainText));
};

exports.discardDraftDispute = function (req, res) {
    disputeHelper.discardDraftDispute(req.params.disputeId)
        .then(function (result) {
            if (result.success) {
                res.json({ success: true });
            }else {
                res.json({ success: false });
           }
        })
        .catch(function (error) {
            res.json({ success: false });
        });
};

exports.submitDispute = function (req, res) {
    disputeHelper.submitDispute(JSON.parse(req.body.dispute), req.body.disputeSubmissionWindowInMinutes)
    .then(function (result) {
        res.json(result);
    })
    .catch(function (error) {
        res.json({ success: false });
    });
};

exports.registerAddress = function (req, res) {
    disputeHelper.registerAddress(req.body.authenticationToken, req.body.chainOfCustodyUrl, req.body.backChainAccountOfLoggedUser)
    .then(function (result) {
        res.json(result);
    })
    .catch(function (error) {
        res.json({ success: false });
    });
};