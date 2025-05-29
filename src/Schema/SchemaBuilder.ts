namespace MC.GAS.Schema {
    /**
     * Helper class that can be used to contruct a schema object that can be validated against
     */
    export class SchemaBuilder {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The current collection of schema properties that will be assigned to the resulting schema object
         */
        private _schemaProperties: ISchemaProperty[];

        /**
         * Information about the current property that is being processed so that we can identify all values before constructing it
         */
        private _currentPropertyName: string;
        private _currentPropertyType: PropertyType;
        private _currentPropertyOptional: boolean;
        private _currentPropertyDefault: any;
        private _currentPropertyValidation: IValueValidation[];

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Initiallise the collection of internal values that are required for processing
         */
        public constructor() {
            this._schemaProperties = [];

            this._currentPropertyName = null;
            this._currentPropertyType = PropertyType.Property;
            this._currentPropertyOptional = false;
            this._currentPropertyDefault = undefined;
            this._currentPropertyValidation = [];
        }

        /**
         * Start adding a new property as a part of the current schema
         * @param name The name of the anticipated property in the schema
         * @param type The type of property that is being created
         * @returns Return a reference to self so we can chain operations
         */
        public addProperty(name: string, type: PropertyType = PropertyType.Property): SchemaBuilder {
            // Finish up any existing property that is underway
            this.completeProperty();

            // The name must be valid, or we are going to have a problem
            if (StringExtensions.isNullOrEmpty(name)) {
                throw `ArgumentNullException: Can't add a new property to the schema, supplied name is empty`;
            }

            // Save the property values that will be used for the new elements
            this._currentPropertyName = name;
            this._currentPropertyType = type;
            return this;
        }

        /**
         * Flag the property that is being created as optional
         * @param isOptional Flags if the property should be considered optional when processing objects
         * @returns Return a reference to self so we can chain operations
         */
        public isOptional(isOptional: boolean): SchemaBuilder {
            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to set property optional state to '${isOptional}' to the schema as there is no active property`;
            }
            if (this._currentPropertyType !== PropertyType.Property) {
                throw `InvalidOperationException: Unable to set property optional state to '${isOptional}' for '${this._currentPropertyName}' as it is the unsupported property type '${this._currentPropertyType}'`;
            }

            // Assign the optional property state
            this._currentPropertyOptional = isOptional;
            return this;
        }

        /**
         * Define the default value that will be assinged to the schema property
         * @param defaultValue The default value that will be assigned to the property when validating and assigning defaults
         * @returns Return a reference to self so we can chain operations
         */
        public withDefault(defaultValue: any): SchemaBuilder {
            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to set property default value to '${defaultValue}' to the schema as there is no active property`;
            }
            if (this._currentPropertyType !== PropertyType.Property) {
                throw `InvalidOperationException: Unable to set property default value to '${defaultValue}' for '${this._currentPropertyName}' as it is the unsupported property type '${this._currentPropertyType}'`;
            }

            // Assign the default value
            this._currentPropertyDefault = defaultValue;
            return this;
        }

        /**
         * 
         * @param rule The rule that should be added to the property for use
         * @returns Return a reference to self so we can chain operations
         */
        public addValueValidation(rule: IValueValidation): SchemaBuilder {
            // Check that the supplied rule is valid
            if (!rule) {
                throw "ArgumentNullException: Unable to add property validation rule, rule is null";
            }

            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to add property validation '${rule.displayString}' to the schema as there is no active property`;
            }
            if (this._currentPropertyType !== PropertyType.Property) {
                throw `InvalidOperationException: Unable to add property validation '${rule.displayString}' for '${this._currentPropertyName}' as it is the unsupported property type '${this._currentPropertyType}'`;
            }

            // Add the rule to the current set
            this._currentPropertyValidation.push(rule);
            return this;
        }

        /**
         * Compile the collection of properties into a schema object that can be evaluated
         * @returns Returns a SchemaCollection object with all the defined schema elements contained in it for testing and use
         */
        public build(): Schema {
            // Finish up the final property that is underway (if any)
            this.completeProperty();

            // Create the schema from the contained properties
            return new Schema(this._schemaProperties);
        }

        //PRIVATE

        /**
         * Complete any property that is currently underway
         */
        private completeProperty(): void {
            // Check if there is a property that is underway
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                return;
            }

            // Create the property object that can be used
            switch (this._currentPropertyType) {
                // Known types
                case PropertyType.Property:
                    this._schemaProperties.push(new SchemaProperty(
                        this._currentPropertyName,
                        this._currentPropertyValidation,
                        this._currentPropertyOptional,
                        this._currentPropertyDefault
                    ));
                    break;
                case PropertyType.InvalidProperty:
                    this._schemaProperties.push(new InvalidProperty(this._currentPropertyName));
                    break;

                // Unknown types
                default: throw `InvalidOperationException: Encountered invalid property type '${this._currentPropertyType}' when processing`;
            }

            // Reset the values that are contained
            this._currentPropertyName = null;
            this._currentPropertyType = PropertyType.Property;
            this._currentPropertyOptional = false;
            this._currentPropertyDefault = undefined;
            this._currentPropertyValidation = [];
        }
    }
}
