namespace MC.GAS.Schema {
    /**
     * Allow for the inverse of any IValueValidation rule to be used
     */
    export class InverseValueValidation implements IValueValidation {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The rule that will be inverse tested
         */
        private _rule: IValueValidation;

        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get a representation of the complexity of the validation process
         * @returns Returns a numerical representation of the complexity of the evaluation operation
         * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
         */
        public get complexity(): number {
            return 1 + this._rule.complexity;
        }

        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return `!(${this._rule.displayString})`;
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return `${this._rule.displayString} was valid`;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Define the rule that is to be inverted when testing
         * @param rule The rule that will be inverted for testing
         */
        public constructor(rule: IValueValidation) {
            this._rule = rule;
        }

        /**
         * Validate to check to see if the specified value is of a valid type
         * @param value The value that is being evaluated
         * @returns Returns the inverse of the contained rule for proccessing
         */
        public isValueValid(value: any): boolean {
            return !this._rule.isValueValid(value);
        }
    }
}
