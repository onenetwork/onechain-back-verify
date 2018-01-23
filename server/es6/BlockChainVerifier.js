import crypto from 'crypto';
import { settingsHelper } from './SettingsHelper';

class BlockChainVerifier {

    generateHash(jsonString) {
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    verifyHash(hash, oneBcClient) {
        if(hash.indexOf('0x') != 0) hash = '0x' + hash;
        return oneBcClient.verify(hash);
    }
}

export const blockChainVerifier = new BlockChainVerifier();
