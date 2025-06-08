namespace MC.GAS.Schema {
    /**
     * Defines an element that will be used to validate incoming data values
     */
    export interface IValidateObject extends IDebugInformation, IComplexity {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Validate that the supplied object meets the required conditions
         * @param obj The object that is to be checked over
         * @returns Returns true if the object passes the validation process
         */
        isValid(obj: MC.GAS.JObject): boolean;
    }
}
