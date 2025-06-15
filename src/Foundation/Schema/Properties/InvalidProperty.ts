namespace MC.GAS.Schema {
    /**
     * Defines a property that can't be included in an object for it to be valid for a schema
     */
    export class InvalidProperty implements ISchemaProperty {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The name of the property that is to be looked for when validating
         */
        private _name: string;

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
            return `!(${this._name} in obj)`;
        }

        /**
         * Get the last reason why a validation attempt failed
         * @returns Returns a string describing the error that occurred when processing the object
         * @comment This can be used to poll why validation failed
         */
        public get failureReason(): string {
            return `Value had property '${this._name}'`;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create the property description with the name of the property to look out for
         * @param name The name of the property that must be excluded from the object
         */
        public constructor(name: string) {
            this._name = name;
        }
        
        /**
         * Check to see if the default value for this property should be applied to the supplied object
         * @param obj The object that is being tested and will be modified based on requirements
         * @comment This should only apply the default if the application would normally fail
         */
        public testApplyDefault(obj: MC.GAS.JObject): void {
            if (!this.isValid(obj)) {
                delete obj[this._name];
            }
        }

        /**
         * Check to see if the nominated property is included in the object
         * @param obj The object that is to be evaluated to determine if the property is contained
         * @returns Returns true if the named property is not included in the object
         */
        public isValid(obj: MC.GAS.JObject): boolean {
            return obj[this._name] === undefined;
        }
    }
}
