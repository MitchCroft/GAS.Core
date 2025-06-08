namespace MC.GAS.Config {
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
}
