import crypto from 'crypto';
import { settingsHelper } from './SettingsHelper';

class BlockChainVerifier {

    generateHash(jsonString) {
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    verifyHash(hash, oneBcClient) {
        if(hash.indexOf('0x') != 0) hash = '0x' + hash;
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                oneBcClient.verify(hash).then(function (verified) {
                    if (verified) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(function (error) {
                    reject("Verification failed");
                });
            }
        });
    }

}

export const blockChainVerifier = new BlockChainVerifier();
