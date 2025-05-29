namespace MC.GAS.Schema {
    /**
     * Interface for an object that can be used to validate if a value is a valid type
     */
    export interface IValueValidation extends IDebugInformation, IComplexity {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Validate to check to see if the specified value is of a valid type
         * @param value The value that is being evaluated
         * @returns Returns an object that describes the result of the validation test operation
         */
        isValueValid(value: any): boolean;
    }
}
