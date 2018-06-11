class Utils {

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

    }

    /**
     * Receives datetime in millis and creates formatted date string to be printed in UI 
     * @param {*} dateInMillis 
     * @returns formatted date string to display. i.e. "Jun 11, 2018 14:12 PM"
     */
    formatDate(dateInMillis) {
        
    }
}

export const utils = new Utils();