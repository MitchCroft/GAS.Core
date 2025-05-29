namespace MC.GAS.DI {
    /**
     *  Interface for a container that is used to build the different elements required to resolve dependencies
     */
    export interface IDependencyBuilder {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Assign a parent container to the dependency container that can be used for resolving references
         * @param parent The container object that should be assigned as the parent for this container
         * @returns Returns a reference to itself to be able to chain operations
         */
        setParent(parent: IDependencyResolver): IDependencyBuilder;

        /**
         * Register an instance of an object that will be included in the container for use
         * @param key The key name that the instance will be registered under so that it can be retrieved
         * @param obj The instance of the object that is to be registered
         * @returns Returns a reference to itself to be able to chain operations
         */
        registerInstance<T>(key: string, obj: T): IDependencyBuilder;

        /**
         * Start the building process that will setup the different elements that are needed for processing
         * @returns Returns a dependency resolver object that can be used to retrieve the different dependency elements
         */
        build(): IDependencyResolver;
    }
}
