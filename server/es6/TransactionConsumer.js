import fs from 'fs';
import path from 'path';

class TransactionConsumer {

    getMessages() {

        /**
         * Platform will return a list of transactions and a flag that indicates whether there are more messages to be fetched or not
         * with hasMorePages flag.
         *  {
                hasMorePages: true/false,
                transactionMessages: [
                { ... }
                ]
            }

         * Names may change. Finalize with PLT
         * 
         */

        let data = fs.readFileSync(path.join(__dirname + "/testData/testTransactions-from-plt.json")).toString();

        return data;
    }
}

export const transactionConsumer = new TransactionConsumer();