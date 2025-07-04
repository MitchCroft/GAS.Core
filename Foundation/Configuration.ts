import { Mapping, JObject } from "./Objects";

/**
 * A single entry in the configuration collection that can be retrieved
 */
export class ConfigurationEntry {
    /*----------Variables----------*/
    //PUBLIC

    /**
     * The name of the configuration entry that is to be retrieved
     */
    public readonly Key: string;

    /**
     * Flags if the entry is optional and shouldn't throw an exception if configuration value isn't available
     */
    public readonly Optional: boolean;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create the configuration entry for use
     * @param key The name of the configuration entry that is to be retrieved
     * @param optional [Optional] Flags if the entry is optional and shouldn't throw an exception if the configuration value isn't available
     */
    public constructor(key: string, optional: boolean = false) {
        this.Key = key;
        this.Optional = optional;
    }
}

/**
 * The lookup collection of configuration entries that can be retrieved for processing
 */
export type ConfigurationCollection = Mapping<ConfigurationEntry>;

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
    getConfigValues(collection: ConfigurationCollection): JObject;

    /**
     * Update a configuration value that is stored in the collection
     * @param key The key that the config value is to be stored under
     * @param value The new vallue that is to be assigned to the key
     */
    setConfigValue(key: string, value: any): void;
}
