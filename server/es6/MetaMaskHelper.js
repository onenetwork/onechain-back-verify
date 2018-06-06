
class MetaMaskHelper {

    constructor() { }

    /**
     * Returns a promise.
     * Either sesolves with the account number or rejects with error codes object:
     * error.metamask.missing
     * error.metamask.locked
     * error.metamask.unknown
     * 
     * {
     *   code: <error code>,
     *   error: <original error object>
     * }
     */
    detectAndReadMetaMaskAccount() {
        return new Promise((resolve, reject) => {
            //Ask for metamask installation
            if (typeof web3 === 'undefined' || typeof web3.currentProvider === 'undefined' || web3.currentProvider.isMetaMask !== true) {
                reject({
                    code: "error.metamask.missing"
                });
            } else if ((navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)
                || navigator.userAgent.indexOf("MSIE") != -1) {
                reject({
                    code: "error.metamask.nosupport"
                });
            } else {
                let web3js = new Web3(web3.currentProvider);
                const me = this;
                let metaMaskResponded = false;
                setTimeout(() => {
                    /* In certain cases, metamask doesn't respond to .getAccount call. That's why the only way to detect is to add a timeout of 20 seconds.*/
                    if (!metaMaskResponded) {
                        reject({
                            code: "error.metamask.locked"
                        });
                    }
                }, 20000);
                web3js.eth.getAccounts(function (err, accounts) {
                    metaMaskResponded = true;
                    if (err != null) {
                        reject({
                            code: "error.metamask.unknown",
                            error: "There's an issue getting metamask account: " + err
                        });
                    } else if (accounts.length == 0) {
                        reject({
                            code: "error.metamask.locked"
                        });
                    } else {
                        resolve(accounts[0]);
                    }
                });
            }
        });
    }
}

export const metaMaskHelper = new MetaMaskHelper();