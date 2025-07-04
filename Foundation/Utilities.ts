/**
 * Provide helper functionality for working with dates
 */
export class DateUtility {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Parse a string date stamp into a usable date object
     * @param datestamp The string representation of the date in the format 'yyyy_MM_dd'
     * @param separator The string sequence that is expected to be between the different date segments
     * @returns Returns the date object for the specified date stamp
     */
    public static parse_yyyy_MM_dd(datestamp: string, separator: string = "_"): Date {
        let parts = datestamp.split(separator);
        if (parts.length !== 3) {
        	throw `Received datestamp '${datestamp}' is not in a supported format`;
        }

        // Grab the parts that are needed
        let year = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }

    /**
     * Format a date object into a 'yyyy_MM_dd' date stamp
     * @param date The date object that is to be converted
     * @param separator [Optional] The string sequence that will be used to separate the different segments
     * @returns Returns a string date stamp representing the supplied date object
     */
    public static format_yyyy_MM_dd(date: Date, separator: string = "_"): string {
        return `${date.getFullYear()}${separator}${(date.getMonth() + 1).toString().padStart(2, '0')}${separator}${date.getDate().toString().padStart(2, '0')}`;
    }
}
