import crypto from 'crypto';
import { settingsHelper } from './SettingsHelper';

class BlockChainVerifier {

    generateHash(jsonString) {
        const hash = '0x' + crypto.createHash('sha256').update(jsonString).digest('hex');
        return hash;
    }

    verifyBlockChain(hashCode, oneBcClient) {
        return new Promise((resolve, reject) => {
            if (oneBcClient != null) {
                oneBcClient.verify(hashCode).then(function (verified) {
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