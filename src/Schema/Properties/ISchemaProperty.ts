namespace MC.GAS.Schema {
    /**
     * Basic interface that marks a property object that can be added to a schema
     */
    export interface ISchemaProperty extends IValidateObject {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * The name of the property that is being processed
         * @returns Returns a string of the property that is represented by this entry
         */
        get name(): string;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if the default value for this property should be applied to the supplied object
         * @param obj The object that is being tested and will be modified based on requirements
         * @comment This should only apply the default if the application would normally fail
         */
        testApplyDefault(obj: MC.GAS.JObject): void;
    }
}
