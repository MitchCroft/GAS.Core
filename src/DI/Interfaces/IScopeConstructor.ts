namespace MC.GAS.DI {
    /**
     * Defines an object that can be used to create a dependency scope element for use
     */
    export interface IScopeConstructor {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create a level of scope with the defined parent
         * @returns Returns the builder that has been setup with the required elements for final use
         */
        createScope(): IDependencyBuilder;
    }
}
