import {syncTransactionTaskHelper} from './SyncTransactionTaskHelper';
import {payloadHelper} from './PayloadHelper';
import {blockChainVerifier} from './BlockChainVerifier';
import {transactionHelper} from './TransactionHelper';
import {disputeHelper} from './DisputeHelper';
import {settingsHelper} from './SettingsHelper';
import {receiveTransactionsTask} from './ReceiveTransactionsTask';
import { dbconnectionManager } from './DBConnectionManager';
import {backChainUtil} from './BackChainUtil';
import fs from 'fs';
import zlib from 'zlib';

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
    syncTransactionTaskHelper.startSyncFromCertainDate(req.body.authenticationToken, req.body.startFromDate, req.body.chainOfCustodyUrl, req.body.offset, (error, result) => {
        if(error) {
            res.json({success : false});
        } else {
            res.json(result);res.json(result);
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
        res.json({success: true, syncStatisticsInfo: result});
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
    let tnxId = req.body.transactionId == 'null' || typeof req.body.transactionId == 'undefined' ? null : req.body.transactionId;
    let disputingPartyAddress = req.body.disputingPartyAddress == 'null' || typeof req.body.disputingPartyAddress == 'undefined' ? null : JSON.parse(req.body.disputingPartyAddress);
    disputeHelper.getOpenDisputeCount(tnxId, disputingPartyAddress)
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

exports.registerAddress = function (req, res) {
    disputeHelper.registerAddress(req.body.authenticationToken, req.body.chainOfCustodyUrl, req.body.backChainAccountOfLoggedUser)
    .then(function (result) {
        res.json(result);
    })
    .catch(function (error) {
        res.json({ success: false });
    });
};

exports.readBackChainAddressMapping = function(req, res) {
    disputeHelper.readBackChainAddressMapping()
    .then(function (result) {
        res.json({success: true, backChainAddressMapping: result});
    })
    .catch(function (error) {
        res.json({success: false});
    });
}

exports.downloadViewDocument = function(req, res) {
    const document = __dirname + "/../attachments/" + req.params.documentName.trim();
    res.setHeader("Content-Disposition","attachment; filename=\"" + req.params.fileName.trim() + "\"");
    fs.stat(document, function(err, stat) {
        if(!err) {
            const unzip = zlib.createUnzip();  
            const filestream = fs.createReadStream(document);
            filestream.pipe(unzip).on('error', function (err) {
                    console.log("error while unzipping file.");
                    res.status(404).end();
                }).pipe(res);
        } else {
            res.status(404).end();
        }
    });
}

exports.verifyDocumentHashes = function(req, res) {
    let promisesToWaitOn = [];
    let attachmentVerificationMap = {};
    let attachments = JSON.parse(req.body.attachments);
    let idArr = [];
    let hashArr = [];
    for (let key in attachments) {
        if (attachments.hasOwnProperty(key)) {
            let attachmentsArray = attachments[key];
            for(let i = 0; i < attachmentsArray.length; i++) {
                let id = (attachmentsArray[i].id).replace("/", "_");
                let hash = attachmentsArray[i].hash;
                idArr.push(id);
                hashArr.push(hash);
                promisesToWaitOn.push(backChainUtil.fileHash(__dirname + "/../attachments/", id.trim()));
            }
        }
    }

    Promise.all(promisesToWaitOn).then(function (results) {
        for(let i = 0; i < results.length; i++) {
            if(results[i])
                attachmentVerificationMap[idArr[i]] = (results[i]===hashArr[i]);
            else
                attachmentVerificationMap[idArr[i]] = results[i];
        }
        res.json({success: true, attachmentVerificationMap: attachmentVerificationMap});           
    }).catch(error => {
        console.error('error verifying file: ' + error);
    });
}