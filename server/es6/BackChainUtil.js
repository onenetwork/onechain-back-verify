/*
 Helper class contains utilities
*/
class BackChainUtil {
    constructor() {}

    // Adds http:// to the url if it doesn't contain a protocol,
    // and optionally adds parameters to the URL if cfg is supplied.
    returnValidURL(url, cfg) {
        var matchProtocol = new RegExp("^(http|https)://", "i");
        if(!matchProtocol.test(url)) {
            url = "http://" + url;
        }

        if(cfg) {
            for(let paramName in cfg) {
                let sepChar = url.indexOf('?') < 0 ? '?' : '&';
                url += sepChar + encodeURIComponent(paramName) + '=' + encodeURIComponent(cfg[paramName]);
            }
        }

        console.log(' > Url: ' + url);
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
