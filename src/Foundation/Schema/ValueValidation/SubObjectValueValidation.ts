namespace MC.GAS.Schema {
    /**
     * Check to see if an object property has a specific schema
     */
    export class SubObjectValueValidation implements IValueValidation {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The schema that the property field can be compared against
         */
        private _schema: Schema;

        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get a representation of the complexity of the validation process
         * @returns Returns a numerical representation of the complexity of the evaluation operation
         * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
         */
        public get complexity(): number {
            return this._schema.complexity;
        }

        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return this._schema.displayString;
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return this._schema.failureReason;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create the validation rule with the specified values
         * @param schema The schema that the checked against values will be compared to
         */
        public constructor(schema: Schema) {
            this._schema = schema;
        }

        /**
         * Validate to check to see if the specified value is of a valid type
         * @param value The value that is being evaluated
         * @returns Returns an object that describes the result of the validation test operation
         */
        public isValueValid(value: any): boolean {
            return this._schema.isValid(value);
        }
    }
}
