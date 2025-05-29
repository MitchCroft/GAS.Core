namespace MC.GAS.Schema {
    /**
     * Helper class that can be used to construct the collection of schema objects that can be validated against
     */
    export class SchemaCollectionBuilder {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of completely defined schema that have been added to the builder
         */
        private _schema: Dictionary<Schema>;

        /**
         * Information about the current schema that is being procesed so that we can identify all values before constructing it
         */
        private _currentSchemaName: string;
        private _currentSchemaProperties: ISchemaProperty[];

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
         * Initialise the collection of internal values that are required for processing
         */
        public constructor() {
            this._schema = new Dictionary<Schema>();

            this._currentSchemaName = null;
            this._currentSchemaProperties = [];

            this._currentPropertyName = null;
            this._currentPropertyType = PropertyType.Property;
            this._currentPropertyOptional = false;
            this._currentPropertyDefault = undefined;
            this._currentPropertyValidation = [];
        }

        /**
         * Start a new schema that can start having values added to it
         * @param name The key name that is to be given to the schema that is created
         * @returns Return a reference to self so we can chain operations
         */
        public addSchema(name: string): SchemaCollectionBuilder {
            // We want to finish up any existing schema that is underway
            this.completeSchema();

            // The name must be valid, or we are going to have a problem
            if (StringExtensions.isNullOrEmpty(name)) {
                throw "ArgumentNullException: Can't start adding a new schema, the supplied name is empty";
            }

            // Save the name that will be used for the schema
            this._currentSchemaName = name;
            return this;
        }

        /**
         * Start adding a new property as a part of the current schema
         * @param name The name of the anticipated property in the schema
         * @param type The type of property that is being created
         * @returns Return a reference to self so we can chain operations
         */
        public addProperty(name: string, type: PropertyType = PropertyType.Property): SchemaCollectionBuilder {
            // If there is no schema, then we have a problem
            if (StringExtensions.isNullOrEmpty(this._currentSchemaName)) {
                throw `InvalidOperationException: Unable to define new schema property '${name}' as there is no active schema`;
            }

            // Finish up any existing property that is underway
            this.completeProperty();

            // The name must be valid, or we are going to have a problem
            if (StringExtensions.isNullOrEmpty(name)) {
                throw `ArgumentNullException: Can't add a new property to the schema '${this._currentSchemaName}', supplied name is empty`;
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
        public isOptional(isOptional: boolean): SchemaCollectionBuilder {
            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentSchemaName)) {
                throw `InvalidOperationException: Unable to set property optional state to '${isOptional}' as there is no active schema`;
            }
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to set property optional state to '${isOptional}' for the schema '${this._currentSchemaName}' as there is no active property`;
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
        public withDefault(defaultValue: any): SchemaCollectionBuilder {
            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentSchemaName)) {
                throw `InvalidOperationException: Unable to set property default value to '${defaultValue}' as there is no active schema`;
            }
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to set property default value to '${defaultValue}' for the schema '${this._currentSchemaName}' as there is no active property`;
            }
            if (this._currentPropertyType !== PropertyType.Property) {
                throw `InvalidOperationException: Unable to set property default value to '${defaultValue}' for '${this._currentPropertyName}' as it is the unsupported property type '${this._currentPropertyType}'`;
            }

            // Cache the default value that will be used
            this._currentPropertyDefault = defaultValue;
            return this;
        }

        /**
         * 
         * @param rule The rule that should be added to the property for use
         * @returns Return a reference to self so we can chain operations
         */
        public addValueValidation(rule: IValueValidation): SchemaCollectionBuilder {
            // Check that the supplied rule is valid
            if (!rule) {
                throw "ArgumentNullException: Unable to add property validation rule, rule is null";
            }

            // Check that there is an active property that can be adjusted
            if (StringExtensions.isNullOrEmpty(this._currentSchemaName)) {
                throw `InvalidOperationException: Unable to add property validation '${rule.displayString}' as there is no active schema`;
            }
            if (StringExtensions.isNullOrEmpty(this._currentPropertyName)) {
                throw `InvalidOperationException: Unable to add property validation '${rule.displayString}' for the schema '${this._currentSchemaName}' as there is no active property`;
            }
            if (this._currentPropertyType !== PropertyType.Property) {
                throw `InvalidOperationException: Unable to add property validation '${rule.displayString}' for '${this._currentPropertyName}' as it is the unsupported property type '${this._currentPropertyType}'`;
            }

            // Add the rule to the current set
            this._currentPropertyValidation.push(rule);
            return this;
        }

        /**
         * Compile the collection of schema into a collection object that can be evaluated
         * @returns Returns a SchemaCollection object with all the defined schema elements contained in it for testing and use
         */
        public build(): SchemaCollection {
            // Finish up the final schema that is underway
            this.completeSchema();

            // Create the collection that can be used
            let collection = new SchemaCollection();
            this._schema.enumerateEntries((name, schema) => collection.addSchema(name, schema));
            return collection;
        }

        //PRIVATE

        /**
         * Complete any schema that is currently underway
         */
        private completeSchema(): void {
            // Check if there is a schema that is underway
            if (StringExtensions.isNullOrEmpty(this._currentSchemaName)) {
                return;
            }

            // First thing we want to do is finish properties
            this.completeProperty();

            // Add the new schema definition to the final collection
            this._schema.add(
                this._currentSchemaName,
                new Schema(this._currentSchemaProperties)
            );

            // Reset the values that are contained
            this._currentSchemaName = null;
            this._currentSchemaProperties = [];
        }

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
                    this._currentSchemaProperties.push(new SchemaProperty(
                        this._currentPropertyName,
                        this._currentPropertyValidation,
                        this._currentPropertyOptional,
                        this._currentPropertyDefault
                    ));
                    break;
                case PropertyType.InvalidProperty:
                    this._currentSchemaProperties.push(new InvalidProperty(this._currentPropertyName));
                    break;

                // Unknown types
                default: throw `InvalidOperationException: Encountered invalid property type '${this._currentPropertyType}' when processing schema '${this._currentSchemaName}'`;
            }

            // Reset the values that are contained
            this._currentPropertyName = null;
            this._currentPropertyType = PropertyType.Property;
            this._currentPropertyOptional = false;
            this._currentPropertyDefault = undefined;
            this._currentPropertyValidation = [];
        }
    }

    /**
     * Define the different types of ISchemaProperty objects there are that can be processed
     */
    export enum PropertyType {
        /**
         * A property that should exist in the current schema
         */
        Property = 0,

        /**
         * A property that should not exist in the current schema
         */
        InvalidProperty = 1,
    }
}
