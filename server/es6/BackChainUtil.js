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
}
export const backChainUtil = new BackChainUtil();