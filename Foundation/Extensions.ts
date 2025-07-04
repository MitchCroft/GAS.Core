/**
 * A collection of extension functions that can be used for string values
 */
export class StringExtensions {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Checks to see if a string is valid and has content
     * @param str The string that is being checked
     * @returns Returns true if the string is null or empty
     */
    public static isNullOrEmpty(str: string | null | undefined): str is null | undefined {
        return !str || str.trim().length === 0;
    }

    /**
     * Remove all non-alphanumeric characters from a string
     * @param str The input string that is to be processed
     * @returns Returns the remaining string characters after removing non-alphanumeric elements
     */
    public static removeNonAlphanumeric(str: string) {
        if (this.isNullOrEmpty(str)) {
            return "";
        }
        return str.replace(/./g, char => {
            if (char === ' ' || /[a-zA-Z0-9]/.test(char)) {
                return char;
            }
            return '';
        }).trim();
    }
}
