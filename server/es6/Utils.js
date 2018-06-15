import momentTimeZone from'moment-timezone';
import moment from 'moment';

class Utils {

    constructor() {
        this.dateFormatter = function(dateInMillis) {
            return moment(new Date(dateInMillis)).format('MMM DD, YYYY HH:mm A');
        }
    }
    
    
    /**
     * Overrides default date formatting function
     * @param dateFormatter a function which accepts time in millist and coverts it to a datetime string
     */
    setDateFormatter(dateFormatter) {
        this.dateFormatter = dateFormatter;
    }
    
    /**
     * Receives datetime in millis and creates formatted date string to be printed in UI 
     * @param {*} dateInMillis 
     * @returns formatted date string to display. i.e. "Jun 11, 2018 14:12 PM"
     */
    formatDate(dateInMillis) {
        return this.dateFormatter(dateInMillis);
    }
    
    /**
     * Receives PLT formatted date and converts it into milliseconds
     * "LastModifiedDate": {
     *      "date": "2018-06-11T14:12:43",
     *      "tzId": "America/Los_Angeles",
     *      "tzCode": "PDT"
     * }
     * 
     * date string is converted into milliseconds according to the timezone 
     * information given.
     * @param {*} pltDateObject 
     * @returns time in milliseconds
     */
    convertPlatformDateToMillis(pltDateObject) {
        return momentTimeZone.tz(pltDateObject.date, pltDateObject.tzId).toDate().getTime();
    }
    
}

export const utils = new Utils();