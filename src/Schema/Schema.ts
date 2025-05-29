namespace MC.GAS.Schema {
    /**
     * Defines a collection of properties that are expected for an object to have that can be validated
     */
    export class Schema implements IValidateObject {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of properties that are expected to be in a tested object
         */
        private _properties: ISchemaProperty[];

        /**
         * Cache the complexity of the elements within the schema for processing
         */
        private _complexity: number;

        /**
         * The last reason why an object schema validation failed for testing
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
            return `{\n\t${this._properties.map(x => `"${x.name}": "${x.displayString}"`).join("\n\t")}\n}`;
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
         * Create this object with the collection of properties that are to be managed
         * @param properties The collection of properties that will be evaluated in this 
         */
        public constructor(properties: ISchemaProperty[]) {
            // There need to be properties to test
            if (!properties || properties.length === 0) {
                throw "ArgumentNullException: There were no properties supplied to the object schema for use";
            }

            // Set the starting values
            this._properties = properties;
            this._complexity = 1;
            this._failureReason = "";

            // Add up the collection of properties for the final complexity score
            for (let i = 0; i < this._properties.length; ++i) {
                this._complexity += this._properties[i].complexity;
            }
        }

        /**
         * Try to apply the nominated default property values to the object if they are currently invalid for their defined rules
         * @param obj The object that will have default property values assigned
         */
        public applyDefaultProperties(obj: MC.GAS.JObject): void {
            for (let i = 0; i < this._properties.length; ++i) {
                this._properties[i].testApplyDefault(obj);
            }
        }

        /**
         * Validate that the supplied object meets the required conditions
         * @param obj The object that is to be checked over
         * @returns Returns true if the object passes the validation process
         */
        public isValid(obj: MC.GAS.JObject): boolean {
            // Clear any previous failure reason that is no longer required
            this._failureReason = "";

            // We need to make sure that all properties that are in the schema are valid
            let success = true;
            for (let i = 0; i < this._properties.length; ++i) {
                // If the property could be validated, we don't need to worry about it
                if (this._properties[i].isValid(obj)) {
                    continue;
                }

                // Otherwise, we have a problem
                success = false;
                if (this._failureReason === "") {
                    this._failureReason = this._properties[i].failureReason;
                } else {
                    this._failureReason += `\n${this._properties[i].failureReason}`;
                }
            }
            return success;
        }
    }
}
