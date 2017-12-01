import crypto from 'crypto';
import { settingsHelper } from './SettingsHelper';

class BlockChainVerifier {

    generateHash(jsonString) {
        const hash = '0x' + crypto.createHash('sha256').update(jsonString).digest('hex');
        return hash;
    }

    verifyBlockChain(stringifiedSlice, oneBcClient) {
        return oneBcClient.verify(this.generateHash(stringifiedSlice));
    }
}

export const blockChainVerifier = new BlockChainVerifier();