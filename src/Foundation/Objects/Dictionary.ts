namespace MC.GAS {
    /**
     * A wrapper around the dictionary type that can be used to manage contents
     */
    export class Dictionary<T> {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * Store the internal collection of lookup elements that can be handled
         */
        private _dictionary: Mapping<T>;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Initialise the internal collection for use
         */
        public constructor() {
            this._dictionary = {};
        }

        /**
         * Retrieve a collection of all the keys that are in this dictionary
         * @returns Returns an array of strings that are contained in the collection
         */
        public getKeys(): string[] {
            return Object.keys(this._dictionary);
        }

        /**
         * Iterate over all of the keys and their values in the collection
         * @param action The callback function that will be raised with the contained information
         */
        public enumerateEntries(action: (key: string, value: T) => void): void {
            for (const key in this._dictionary) {
                if (this._dictionary.hasOwnProperty(key)) {
                    action(key, this._dictionary[key]);
                }
            }
        }

        /**
         * Check to see if the dictionary has a key in the collection
         * @param key The key that is to be looked for in the collection
         * @returns Returns a boolean value that indicates if the collection has the specified key
         */
        public hasKey(key: string): boolean {
            return key in this._dictionary;
        }

        /**
         * Add an element to the lookup dictionary under the specified key
         * @param key The key that the value is to be stored under
         * @param value The value that is to be stored under the key
         */
        public add(key: string, value: T): void {
            if (this.hasKey(key)) {
                throw `DuplicateKeyException: There is already a value stored under the key '${key}'`;
            }
            this._dictionary[key] = value;
        }

        /**
         * Forcibly set a value in the lookup dictionary, replacing anything that was previously there
         * @param key The key that the value is to be stored under
         * @param value The value that is to be stored under the key
         */
        public replace(key: string, value: T): void {
            this._dictionary[key] = value;
        }

        /**
         * Try to remove a value stored under the specified key
         * @param key The key that is to be removed from the internal collection
         * @returns Returns true if there was a value to be removed in the collection
         */
        public remove(key: string): boolean {
            // If the key doesn't exist, not a problem
            if (!this.hasKey(key)) {
                return false;
            }

            // Re-create the collection with all except the specified
            delete this._dictionary[key];
            return true;
        }

        /**
         * Retrieve the value that is contained in the object under the specified key
         * @param key The key of the element that is to be retrieved
         * @returns Returns the value that is stored in the collection under the specified key
         */
        public get(key: string): T {
            if (!this.hasKey(key)) {
                throw `MissingKeyException: There is no value stored in the dictionary under the key '${key}'`;
            }
            return this._dictionary[key];
        }

        /**
         * Create a dictionary object from the specified mapping
         * @param mapping The mapping that provides the foundation of the dictionary object
         * @returns Returns a dictionary object from the specified mapping object
         */
        public static fromMapping<T>(mapping: Mapping<T>): Dictionary<T> {
            let dictionary = new Dictionary<T>();
            dictionary._dictionary = mapping;
            return dictionary;
        }
    }
}
