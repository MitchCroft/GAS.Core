namespace MC.GAS.Schema {
    /**
     * Base class for a schema property that will be used to validate the properties of an object
     */
    export class SchemaProperty implements ISchemaProperty {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The expected name of the property that is to be checked
         */
        private _name: string;

        /**
         * The collection of rules that will be applied to the value in the object to determine if it is valid
         * @comment These will be treated as an OR operation, only one needs to be valid to pass
         */
        private _rules: IValueValidation[];

        /**
         * Cache the complexity value of the rules that are assigned to this property for processing
         */
        private _complexity: number;

        /**
         * Flags if the property is optional and isn't required on the object
         * @comment If the value is included, it will need to match the rules provided
         */
        private _isOptional: boolean;

        /**
         * The value that should be assigned when defaults are applied to the property
         * @comment This will only be applied if the object fails on the property checks
         */
        private _defaultValue: any;

        /**
         * The reason the last validation test failed to be processed
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
         * The name of the property that is being processed
         * @returns Returns a string of the property that is represented by this entry
         */
        public get name(): string {
            return this._name; 
        }
 
        /**
         * Get the display string representation of the object for debugging
         * @returns Returns a string that describes the action of the object
         */
        public get displayString(): string {
            return `'${this._name}' ${(this._isOptional ? "Optionally" : "")} Included${(!this._rules || this._rules.length === 0 ? "" : ` with [${this._rules.map(x => x.displayString).join(" | ")}]`)}`;
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
         * Create the schema property with the required information for validation
         * @param name The name of the property that will be identified and processed
         * @param rules [Optional] The collection of rules that will be applied to the existing value. These will be treated as an OR operation, only one needs to be valid to pass
         * @param isOptional [Optional] Flags if the property is required to exist in the object being tested
         * @param defaultValue [Optional] The default value that will be assigned to tested objects when requested and conditions fail
         */
        public constructor(name: string, rules: IValueValidation[] = null, isOptional: boolean = false, defaultValue: any = undefined) {
            this._name = name;
            this._rules = rules;
            this._complexity = 1;
            this._isOptional = isOptional;
            this._defaultValue = defaultValue;

            if (this._rules) {
                this._rules.sort((l, r) => l.complexity - r.complexity);
                for (let i = 0; i < this._rules.length; ++i) {
                    this._complexity += this._rules[i].complexity;
                }
            }
        }
        
        /**
         * Check to see if the default value for this property should be applied to the supplied object
         * @param obj The object that is being tested and will be modified based on requirements
         * @comment This should only apply the default if the application would normally fail
         */
        public testApplyDefault(obj: MC.GAS.JObject): void {
            if (!this.isValid(obj)) {
                obj[this._name] = this._defaultValue;
            }
        }

        /**
         * Check an object matches the requirements by this property
         * @param obj The object that is to be checked for the current property values
         * @returns Returns true if the object passes the schema property requirements
         */
        public isValid(obj: MC.GAS.JObject): boolean {
            // Reset the failure reason
            this._failureReason = "";

            // Check that the property exists in the object
            if (!(this._name in obj)) {
                // If this is optional, then no problem
                if (this._isOptional) {
                    return;
                }

                // We're missing the value
                this._failureReason = `Value is missing property '${this._name}'`;
                return false;
            }

            // If we have no rules, then it's valid
            if (!this._rules || this._rules.length === 0) {
                return true;
            }

            // Now we can get the value and process it
            let value: any = obj[this._name];
            for (let i = 0; i < this._rules.length; ++i) {
                if (this._rules[i].isValueValid(value)) {
                    return true;
                }
            }

            // We failed on validation of all rules
            this._failureReason = `'${this._name}' failed conditions [${this._rules.map(x => x.failureReason).join(" | ")}]`;
            return false;
        }
    }
}
