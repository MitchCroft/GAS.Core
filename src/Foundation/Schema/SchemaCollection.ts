namespace MC.GAS.Schema {
    /**
     * A collection of schema options that data can take, allowing for the matching the required one for processing
     */
    export class SchemaCollection {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of schema elements that can be selected from in the collection
         */
        private _options: Dictionary<Schema>;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create the collection of schema options that can be matched against
         */
        public constructor() {
            this._options = new Dictionary<Schema>();
        }

        /**
         * Check to see if this collection has a schema registered under the specified name
         * @param key The key that the specified schema is stored under to be checked
         */
        public hasSchema(key: string): boolean {
            return this._options.hasKey(key);
        }

        /**
         * Retrieve the schema from the collection that is stored under the specified entry
         * @param key The key of the specified schema that is to be retrieved
         * @returns Returns the Schema object that is stored under the specified key or null if none
         */
        public getSchema(key: string): Schema {
            return (this._options.hasKey(key) ? this._options.get(key) : null);
        }

        /**
         * Add a schema to the internal collection of options to test against
         * @param key The key that the specified schema should be stored under
         * @param schema The schema object that will be validated against when performing checks
         */
        public addSchema(key: string, schema: Schema): void {
            this._options.add(key, schema);
        }

        /**
         * Forcibly add a schema to the internal collection of options in a way that will replace a pre-existing entry
         * @param key The key that the specified schema should be stored under
         * @param schema The schema object that will be validated against when performing checks
         */
        public replaceSchema(key: string, schema: Schema): void {
            this._options.replace(key, schema);
        }

        /**
         * Remove a schema from the collection of elements to validate against
         * @param key The key of the schema that is to be removed from the collection
         * @returns Returns true if a schema with the matching name could be found and removed
         */
        public remove(key: string): boolean {
            return this._options.remove(key);
        }

        /**
         * Get the collection of keys for schemas that are defined in this collection
         * @returns Returns an array of the keys that are used for storing schema
         */
        public getSchemaKeys(): string[] {
            return this._options.getKeys();
        }

        /**
         * Check the supplied object against the contained schema to look for a match that can be handled
         * @param obj The object that is to be evaluated to look for a match
         * @returns Returns a tuple that describes the result of the search, with the first value being a flag to indicate if a match was found and the second the key of the schema that was a match
         */
        public validateObjectSchema(obj: MC.GAS.JObject): [boolean, string?] {
            // Check over all of the schema that need to be validated against
            for (const key of this._options.getKeys()) {
                // We need to check to see if the object can be matched against the schema
                if (this._options.get(key).isValid(obj)) {
                    return [true, key];
                }
            }

            // If we made it this far, we couldn't find a match
            return [false];
        }
    }
}
