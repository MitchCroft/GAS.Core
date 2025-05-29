namespace MC.GAS.DI {
    /**
     * Provide an interface for an object that can be used to register elements with a IDependencyBuilder
     */
    export interface IInstaller {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Install required elements from the specified object for use in operation
         * @param builder The builder that can be used to assign elements that are needed for operation
         */
        install(builder: IDependencyBuilder): void;
    }
}
