namespace MC.GAS.StringComparison {
    /**
     * Provides an interface for an object that can be used to evaluate string distance values
     */
    export interface IStringComparison {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Calculate the number of changes that need to be made to convert the target to the source
         * @param source The source string that is used for the calculations
         * @param target The target string that is used for the calculations
         * @returns Returns the number of character changes needed to have two identical strings
         */
        calculateDistance(source: string, target: string): number;
    }
}
