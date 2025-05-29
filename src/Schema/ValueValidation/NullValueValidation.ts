namespace MC.GAS.Schema {
    /**
     * Check to see if the value that is supplied is a null value
     */
    export class NullValueValidation implements IValueValidation {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get a representation of the complexity of the validation process
         * @returns Returns a numerical representation of the complexity of the evaluation operation
         * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
         */
        public get complexity(): number {
            return 1;
        }

        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return "value === null";
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return "Value was not null";
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Validate to check to see if the specified value is null
         * @param value The value that is being evaluated
         * @returns Returns true if the value is null
         */
        public isValueValid(value: any): boolean {
            return value === null;
        }
    }
}
