/**
 * Denotes a class that requires additional initialisation after being constructed
 */
export interface IInitialisable {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Process the initialisation of contained values as required
     */
    init(): void;
}

/**
 * Utility class to help with identifying initialisation objects
 */
export class InitialisationUtility {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Check to see if an object matches the IInitialisable interface
     * @param obj The object that is to be checked against the interface
     * @returns Returns true if the object is of the interface type
     */
    static isInterface(obj: any): obj is IInitialisable {
        return typeof obj.init === "function";
    }
}

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
