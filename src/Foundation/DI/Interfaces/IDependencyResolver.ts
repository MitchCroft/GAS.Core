namespace MC.GAS.DI {
    /**
     * Object that contains the elements needed to retrieve dependency elements that are desired
     */
    export interface IDependencyResolver {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * Flags if this resolver has been constructed and is ready for use
         */
        get isConstructed(): boolean;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Function that will be used to start constructing the elements that are contained
         */
        construct(): void;

        /**
         * Add a callback that will be raised after all of the elements have been constructed and can start processing elements
         * @param callback The callback that should be raised after the construction process is complete
         */
        addPostConstructCallback(callback: PostConstructionCallback): void;

        /**
         * Check to see if there is an element in the resolver hierarchy for the specified value
         * @param key The key of the registration that is being checked
         */
        hasRegistered(key: string): boolean;

        /**
         * Retrieve the registered value that is registered in the container
         * @param key The key that the defined instance is stored under for processing
         * @returns Returns the instance of the object in the collection that can be used
         */
        resolve<T>(key: string): T | undefined;

        /**
         * Retrieve the registered values that are registered in the container
         * @param key The key that the defined instances are stored under for processing
         * @returns Returns an array of the object instances in the collection that can be used
         */
        resolveCollection<T>(key: string): T[] | undefined;
    }

    /**
     * Delegate that can be used to raise callback events after the initial construction of the resolver has been setup
     */
    export type PostConstructionCallback = (resolver: IDependencyResolver) => void;
}
