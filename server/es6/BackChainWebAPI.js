import {syncTransactionTaskHelper} from './SyncTransactionTaskHelper';
import {payloadHelper} from './PayloadHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {transactionHelper} from './TransactionHelper';
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
    syncTransactionTaskHelper.startSyncFromCertainDate(req.body.authenticationToken, req.body.startFromDate, req.body.chainOfCustodyUrl, function(error, result) {
        if(error) {
            res.json({success : false});
        } else {
            res.json(result);
        }
    });
};

exports.consumeTransactionMessages = function(req, res) {
    receiveTransactionsTask.consumeTransactionMessages(req.body.authenticationToken, req.body.chainOfCustodyUrl, function(error, result) {
        if(error) {
            res.json({consumeResult : {success : false}});
        } else {
            result.success = true;
            res.json({consumeResult : result});
        }
    });
}

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
