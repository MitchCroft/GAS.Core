namespace MC.GAS.Config {
    /**
     * Interface for an object that can be used to get and set configuration values that are being used for the application lifetime
     */
    export interface IConfigurationProvider {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if there is a configuration value with the specified key
         * @param key The configuration value that is to be looked for
         * @returns Returns true if there is a configuration value with the specified key
         */
        hasConfigValue(key: string): boolean;

        /**
         * Retrieve a configuration value from the internal collection of values
         * @param key The key that the config value is to be stored under
         * @returns Returns the string value that is assigned to the key
         */
        getConfigValue(key: string): any;

        /**
         * Retrieve a group of configuration values from the internal collection of values
         * @param collection The collection of configuration values that are to be retrieved. The key is property name that will be returned
         * @returns Returns a generic mapping object with the received content
         */
        getConfigValues(collection: ConfigurationCollection): MC.GAS.JObject;

        /**
         * Update a configuration value that is stored in the collection
         * @param key The key that the config value is to be stored under
         * @param value The new vallue that is to be assigned to the key
         */
        setConfigValue(key: string, value: any): void;
    }
}
