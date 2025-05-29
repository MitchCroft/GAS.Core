namespace MC.GAS.Schema {
    /**
     * Check to see if a value is one of the basic value types
     */
    export class BasicValueValidation implements IValueValidation {
        /*----------Varaibles----------*/
        //PRIVATE

        /**
         * Store the basic type that is expected for this validation section
         */
        private _expected: BasicType;

        /**
         * Store the last reason why the validation failed to be processed
         */
        private _failureReason: string;

        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get a representation of the complexity of the validation process
         * @returns Returns a numerical representation of the complexity of the evaluation operation
         * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
         */
        public get complexity(): number {
            return 2;
        }
        
        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return `value === '${this.expectedString}'`;
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return this._failureReason;
        }

        //PRIVATE

        /**
         * Retrieve the string representation of the expected type
         */
        private get expectedString(): string {
            switch (this._expected) {
                // The types we expect
                case BasicType.Undefined:   return "undefined";
                case BasicType.Boolean:     return "boolean";
                case BasicType.Number:      return "number";
                case BasicType.String:      return "string";
                case BasicType.Symbol:      return "symbol";
                case BasicType.BigInt:      return "bigint";
                case BasicType.Object:      return "object";
                case BasicType.Function:    return "function";

                // The ones we don't
                default: throw `InvalidValueException: Receieved the invalid value '${this._expected}' when setting up validation rules`;
            }
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create this validator with the expected type for processing
         * @param expected The type that is expected from tested values
         */
        public constructor(expected: BasicType) {
            this._expected = expected;
            this._failureReason = "";
        }

        /**
         * Validate to check to see if the specified value is of a valid type
         * @param value The value that is being evaluated
         * @returns Returns true if the value is valid according to these rules
         */
        public isValueValid(value: any): boolean {
            this._failureReason = "";
            let valueType = typeof value;
            if (valueType === this.expectedString) {
                return true;
            }
            this._failureReason = `Value was of type '${valueType}' when was expecting '${this.expectedString}'`;
            return false;
        }
    }

    /**
     * Define the different types of types that can be detected by the validation process
     */
    export enum BasicType {
        Undefined   = 0,
        Boolean     = 1,
        Number      = 2,
        String      = 3,
        Symbol      = 4,
        BigInt      = 5,
        Object      = 6,
        Function    = 7
    }
}
