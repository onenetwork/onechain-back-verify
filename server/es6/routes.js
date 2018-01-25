/*
 Configure all routings here
*/
import BackChainWebAPI from './BackChainWebAPI';

export function router(app) {
    app.get('/getLastestSyncedDate', BackChainWebAPI.getLastestSyncedDate);
    app.get('/isInitialSyncDone', BackChainWebAPI.isInitialSyncDone);
    app.get('/getTransactionById/:transId', BackChainWebAPI.getTransactionById);
    app.get('/getTransactionByBusinessTransactionId/:btId', BackChainWebAPI.getTransactionByBusinessTransactionId);
    app.get('/getTransactionByText/:searchText', BackChainWebAPI.getTransactionByText);
    app.post('/saveBlockChainSettings', BackChainWebAPI.saveBlockChainSettings);
    app.get('/getApplicationSettings', BackChainWebAPI.getApplicationSettings);
    app.post('/startSyncFromCertainDate', BackChainWebAPI.startSyncFromCertainDate);
    app.post('/consumeTransactionMessages', BackChainWebAPI.consumeTransactionMessages);
    app.get('/getSyncStatisticsInfo', BackChainWebAPI.getSyncStatisticsInfo);
    app.get('/getSyncStatistics', BackChainWebAPI.getSyncStatistics);
    app.post('/startReceiveTransactionsTimer', BackChainWebAPI.startReceiveTransactionsTimer);
    app.get('/getTransactionsBySequenceNos/:sequenceNos', BackChainWebAPI.getTransactionsBySequenceNos);
    app.get('/getEventsForTransaction/:transId', BackChainWebAPI.getEventsForTransaction);
    app.get('/getTransactionSlice/:payloadId', BackChainWebAPI.getTransactionSlice);
 }
