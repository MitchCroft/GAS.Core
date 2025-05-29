namespace MC.GAS.DI {
    /**
     * Interface for an object that can handle the resolving of it's dependencies
     */
    export interface IInjectionTarget {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Construct the object with the required dependencies
         * @param resolver The interface for the resolver object that will be used to retrieve required dependencies
         */
        construct(resolver: IDependencyResolver): void;
    }

    /**
     * Utility class to help with identifying injection target objects
     */
    export class InjectionTargetUtility {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if the supplied object is valid as an injection target
         * @param obj The object that is being tested to determine if it is an injection target
         * @returns Returns a flag that indicates if the supplied object is an injection target
         */
        static isInterface(obj: any): obj is IInjectionTarget {
            return typeof obj.construct === "function";
        }
    }
}
