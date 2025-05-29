namespace MC.GAS.Schema {
    /**
     * Check to see if a value is an array of values
     */
    export class ArrayValueValidation implements IValueValidation {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * Cache the complexity score for this validation rule that can be used for processing
         */
        private _complexity: number;

        /**
         * An optional collection of sub-value rules that must be true as well as the value being an array
         * @comment This is an OR operation, only one needs to pass for it to be valid
         */
        private _childRules: IValueValidation[] | null;
        
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
            return this._complexity;
        }

        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return (this._childRules && this._childRules.length > 0 ?
                `[IsArray | ${this._childRules.map(x => x.displayString).join(" | ")}]` :
                `[IsArray]`
            );
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return this._failureReason;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create this validation element with the expected values
         * @param childRules [Optional] A collection of sub-value rules that will be applied to all values. This is an OR operation, only one needs to pass for it to be valid
         */
        public constructor(childRules: IValueValidation[] = null) {
            this._complexity = 2;
            this._failureReason = "";
            this._childRules = childRules;
            if (this._childRules) {
                this._childRules.sort((l, r) => l.complexity - r.complexity);
                for (let i = 0; i < this._childRules.length; ++i) {
                    this._complexity += this._childRules[i].complexity;
                }
            }
        }

        /**
         * Validate to check to see if the specified value is of a valid type
         * @param value The value that is being evaluated
         * @returns Returns true if the value is valid according to these rules
         */
        public isValueValid(value: any): boolean {
            // Reset the failure reason
            this._failureReason = "";

            // If the value isn't an array, automatic fail
            if (!Array.isArray(value)) {
                this._failureReason = "Supplied value was not an array";
                return false;
            }

            // Check over the rules that are contained to determine if they can apply
            if (this._childRules) {
                for (let i = 0; i < value.length; ++i) {
                    let found = false;
                    for (let r = 0; r < this._childRules.length; ++r) {
                        if (this._childRules[r].isValueValid(value[i])) {
                            found = true;
                            break;
                        }
                    }

                    // If we couldn't find a match, it fails
                    if (!found) {
                        this._failureReason = `Array value at index ${i} failed conditions [${this._childRules.map(x => x.failureReason).join(" | ")}]`;
                        return false;
                    }
                }
            }

            // If we got this far, it's good
            return true;
        }
    }
}
