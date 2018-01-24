/*
 Helper class contains utilities
*/
class BackChainUtil {
    constructor() {}

    /*checks if url contains http or https. If not it returns by appending http*/
    returnValidURL(url) {
        var matchProtocol = new RegExp("^(http|https)://", "i");
        if(!matchProtocol.test(url)) {
            url = "http://" + url;
        }
        console.log(url);
        return url;
    }

    promiseFor(condition, action, value) {
        return new Promise(resolve => {
            if(!condition(value)) {
                resolve();
                return;
            }

            return action(value)
                .then(backChainUtil.promiseFor.bind(null, condition, action))
                .then(resolve);
        });
    };

}
export const backChainUtil = new BackChainUtil();
