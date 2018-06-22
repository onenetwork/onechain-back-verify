/*
 Helper class contains utilities
*/
import fs from 'fs';
import zlib from 'zlib';
import crypto from 'crypto';

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

    /**
     * returns hash value of file
     * @param {*} filePath 
     * @param {*} fileName 
     */
    fileHash(filePath, fileName) {
        return new Promise((resolve, reject) => {
            const document = filePath + fileName;
            const sha256 = crypto.createHash('sha256');
            fs.stat(document, function(err, stat) {
                if(!err) {
                    try {
                        const filestream = fs.createReadStream(document);
                        const unzip = zlib.createUnzip(); 

                        filestream.pipe(unzip).on('data', function (data) {
                            sha256.update(data)
                        })
                        filestream.on('end', function () {
                            const hash = sha256.digest('hex')
                            return resolve(hash);
                        })
                    } catch (error) {
                        return resolve(null);
                    }
                } else {
                    return resolve(null);
                }
            });
        });
    }
}
export const backChainUtil = new BackChainUtil();
