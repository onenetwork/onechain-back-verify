class RequestHelper {

    filterObject(object, filterFn) {
        return Object.keys(object)
            .filter(key => filterFn(key, object[key]))
            .reduce((res, key) => (res[key] = object[key], res), {});
    }

    mapObject(object, callback, cfg) {
        cfg = cfg || {};
        object = object || {};

        let keysArray = Object.keys(object);
        if (cfg.sort) {
            keysArray.sort();
        }

        return keysArray.map(function(key) {
            return callback(key, object[key]);
        });
    }

    jsonToUrlParams(obj) {
        if (!obj) {
            return '';
        }

        // Filter out all undefined values.
        obj = this.filterObject(obj, (k, v) => v !== undefined);

        let paramsArr = this.mapObject(obj, (k, v) => {
            switch (Object.prototype.toString.call(v)) {
                case '[object Object]':
                case '[object Array]':
                    v = JSON.stringify(v);
                    break;
                case '[object Date]':
                    v = JSON.stringify(Dates.dateToObj(v));
            }

            return k + '=' + encodeURIComponent(v);
        });

        return paramsArr.join('&');
    }
}

export const requestHelper = new RequestHelper();