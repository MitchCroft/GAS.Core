namespace MC.GAS.Schema {
    /**
     * An interface for information that is generated when validating schema to allow for compiling failure messages
     */
    export interface IDebugInformation {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        get displayString(): string;

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        get failureReason(): string;
    }
}
