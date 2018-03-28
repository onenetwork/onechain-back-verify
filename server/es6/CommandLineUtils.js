import {dbconnectionManager} from './DBConnectionManager';

/*
 Helper class contains funtions to perform mongodb commands entered from command line 
*/
class CommandLineUtils {

        constructor() {}

        readCommands() {
            let stdin = process.openStdin();
            let me = this;
            stdin.addListener("data", function(d) {
                // Note:  d is an object, and when converted to a string it will
                // end with a linefeed. so for that, doing 
                // toString() and then trim()
                me.commandController(d.toString().trim())
              });
        }

        commandController(command) {
            const DELETEDATA = 'deletedata', ALL = 'all', TRANSACTIONS = 'transactions', SETTINGS = 'settings',BC_SETTINGS = 'bcSettings',CC_SETTINGS = 'ccSettings';
            const HELP_MONGO = 'help-mongo';

            let invalidCommandMsg = "\nPlease enter valid command. \nFor mongo commands, type help-mongo";
            
            let mongoCommandInfo ="\nCommands with description:\n"
                + "deletedata  [-"+ALL+"] [-"+TRANSACTIONS+"] [-"+SETTINGS+"] [-"+BC_SETTINGS+"] [-"+CC_SETTINGS+"]\n\n"
                + ALL + "           " + "It will delete Settings, Transaction, fs.chunks and fs.files and SyncStatistics collections \n"
                + TRANSACTIONS + "  " + "It will delete Transaction, fs.chunks and fs.files and SyncStatistics collections \n"
                + SETTINGS + "      " + "It will delete Settings collection including both blockChain and chainOfCustody \n"
                + BC_SETTINGS + "    " + "It will delete blockChain settings only \n"
                + CC_SETTINGS + "    " + "It will delete chainOfCustody(plt/kafa) settings \n";

            if(command == HELP_MONGO) {
                console.log(mongoCommandInfo);
                return;
            }

            if(command.indexOf("-") == -1 || command.indexOf(DELETEDATA) == -1) {
                console.log(invalidCommandMsg);
                return;
            }

            let action = command.split("-")[1];
            switch(action) {
                case ALL : this.deleteAll()
                break;
                case TRANSACTIONS : this.deleteTransactions()
                break;
                case SETTINGS : this.deleteSettings()
                break;
                case BC_SETTINGS : this.deleteBCSettings()
                break;
                case CC_SETTINGS : this.deleteCCSettings()
                break;
                default:
                console.log(invalidCommandMsg);
            }

        }

         /**
         * deletes Settings, Transaction, fs.chunks and fs.files and SyncStatistics collections. 
         * (Basically deletes all data)
         */
        deleteAll() {
            this.deleteSettings();
            this.deleteTransactions();
        }

         /**
         * deletes Transaction, fs.chunks and fs.files and SyncStatistics collections
         */
        deleteTransactions() {
            let fileBucketName = 'fs';

            dbconnectionManager.getConnection().collection('Transactions').drop({},function(err, response) {
                if(err)
                    console.error("Deleting Transactions failed: " + err);
                else if(response == true)
                    console.log("Transactions deleted successfully");
                else
                    console.log("Deleting Transactions failed. Please try again");
            });

            dbconnectionManager.getConnection().collection(fileBucketName + '.chunks').drop({},function(err, response) {
                if(err)
                    console.error("Deleting " + fileBucketName +".chunks failed: " + err);
                else if(response == true)
                    console.log(fileBucketName +".chunks deleted successfully");
                else
                    console.log("Deleting " + fileBucketName +".chunks failed. Please try again");
            });

            dbconnectionManager.getConnection().collection(fileBucketName + '.files').drop({},function(err, response) {
                if(err)
                    console.error("Deleting " + fileBucketName +".files failed: " + err);
                else if(response == true)
                    console.log(fileBucketName +".files deleted successfully");
                else
                    console.log("Deleting " + fileBucketName +".files failed. Please try again");
            });

            dbconnectionManager.getConnection().collection('SyncStatistics').drop({},function(err, response) {
                if(err)
                    console.error("Deleting SyncStatistics failed: " + err);
                else if(response == true)
                    console.log("SyncStatistics deleted successfully");
                else
                    console.log("Deleting SyncStatistics failed. Please try again");
            });
        }

        /**
         * deletes Settings collection including both blockChain and chainOfCustody
         */
        deleteSettings() {
            dbconnectionManager.getConnection().collection('Settings').drop({},function(err, response) {
                if(err)
                    console.error("Deleting Settings failed: " + err);
                else if(response == true)
                    console.log("Settings deleted successfully");
                else if(response.result.n == 0)
                    console.log("Deleting Settings failed. Please try again");
            });
        }

        /**
         * deletes blockChain settings only
         */
        deleteBCSettings() {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' })
                .then(function (result) {
                    if (result) {
                        delete result.blockChain;
                        let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({type: 'applicationSettings'}, result,
                        function (err, response) {
                            if(err)
                                console.error("Deleting 'blockChain' from Settings failed: " + err);
                            else if(response.modifiedCount > 0)
                                console.log("Deleted 'blockChain' from Settings successfully");
                            else if(response.modifiedCount == 0)
                                console.log("'blockChain' config does not exist in Settings");
                            else
                                console.error("Deleting 'blockChain' from Settings failed. Please try again");
                        })
                    } else {
                        console.error("'blockChain' config does not exist in Settings");
                    }
            });
        }

        /**
         * deletes chain Of custidy settings only
         */
        deleteCCSettings() {
            dbconnectionManager.getConnection().collection('Settings').findOne({ type: 'applicationSettings' })
                .then(function (result) {
                    if (result) {
                        delete result.chainOfCustidy;
                        let resultSet = dbconnectionManager.getConnection().collection('Settings').updateOne({type: 'applicationSettings'}, result,
                        function (err, response) {
                            if(err)
                                console.error("Deleting 'chainOfCustidy' from Settings failed: " + err);
                            else if(response.modifiedCount > 0)
                                console.log("Deleted 'chainOfCustidy' from Settings successfully");
                            else if(response.modifiedCount == 0)
                                console.log("'chainOfCustidy' config does not exist in Settings");
                            else
                                console.error("Deleting 'chainOfCustidy' from Settings failed. Please try again");
                        })
                    } else {
                        console.error("'chainOfCustidy' config does not exist in Settings");
                    }
            });
        }
    }

export const commandLineUtils = new CommandLineUtils();
