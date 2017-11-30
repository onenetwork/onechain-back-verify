import {syncTransactionTaskHelper} from './SyncTransactionTaskHelper';
import {payloadHelper} from './PayloadHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {transactionHelper} from './TransactionHelper';
import {settingsHelper} from './SettingsHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';

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

exports.uploadZip = function(req, res) {
    payloadHelper.splitTransactions(req.body, function(error, result) {
        let validTransactions = [];
        for (let i = 0; i < result.length; i++) {
            let hashVal = blockChainVerifier.generateHash(JSON.stringify(result[i]));
            let verified = blockChainVerifier.verifyBlockChain(hashVal, null);// need to change null to the oneclient stored in props.store
            if (i % 2 == 1) {
                verified = false;
            }
            if (verified) {
                validTransactions.push(result[i]);
            }
        }
        res.json({
            validTransactions: validTransactions
        });
    });

};


exports.getTransactionById = function(req, res) {
    let data = [];
    transactionHelper.getTransactionById(req.params.transId, function(error, result) {
        data.push(result);
        res.json({result : data});
    });
};

exports.getTransactionByBusineesTransactionId = function(req, res) {
    transactionHelper.getTransactionByBusineesTransactionId(req.params.btId.split(','),function(error, result) {
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
    syncTransactionTaskHelper.startSyncFromCertainDate(req.body.authenticationToken, req.body.startFromDate)
    .then(function(result) {
        res.json(result);
    })
    .catch(function(error) {
        res.json({success : false}); //You can pass an error mesage if needed
    });
};

exports.consumeTransactionMessages = function(req, res) {
    receiveTransactionsTask.consumeTransactionMessages(req.body.authenticationToken, function(error, result) {
        if(error) {
            res.json({success : false});
        } else {
            result.success = true;
            res.json({consumeResult : result});
        }
    });
}