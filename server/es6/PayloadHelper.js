import fs from 'fs';

class PayloadHelper {

    splitTransactions(data, callback) {

        let transactionArr = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                transactionArr.push(data[i][j]);
            }
        }
        callback(null, transactionArr);
    }
}

export const payloadHelper = new PayloadHelper();