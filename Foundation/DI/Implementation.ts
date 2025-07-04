//import * as DI from "./Interfaces"
import { IDependencyResolver, PostConstructionCallback, InjectionTargetUtility, InitialisationUtility, IDependencyBuilder, IScopeConstructor } from "./Interfaces";
import { Dictionary } from "../Objects"

/**
 * Defines an object that has been setup with registered elements that can be supplied resolved for use
 */
export class DependencyResolver implements IDependencyResolver {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The parent resolver that has been assigned to this 
     */
    private _parent: IDependencyResolver | null;

    /**
     * The collection of values that have been included for use with resolution
     */
    private _register: Dictionary<any[]>;

    /**
     * Flags if this resolver has been constructed with the contained values processed
     */
    private _isContructed: boolean;

    /**
     * The collection of callbacks that should be raised once finished with construction
     */
    private _postConstructCallbacks: PostConstructionCallback[] | null;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Retrieve the flag that determines if this resolver has been constructed for use
     */
    public get isConstructed(): boolean {
        return this._isContructed;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create the resolver with the initial collection of elements that can be used when resolving data
     * @param parent The parent resolver that has been assigned to the contained
     * @param register The register of objects that were created and are ready to be used
     */
    public constructor(parent: IDependencyResolver | null, register: Dictionary<any[]>) {
        this._parent = parent;
        this._register = register;
        this._isContructed = false;
        this._postConstructCallbacks = [];
    }

    /**
     * Add a callback that will be raised after all of the elements have been constructed and can start processing elements
     * @param callback The callback that should be raised after the construction process is complete
     */
    public addPostConstructCallback(callback: PostConstructionCallback): void {
        if (this._isContructed) {
            throw "InvalidOperationException: Unable to add post construction callback as this container has already been constructed";
        }
        if (this._postConstructCallbacks !== null) {
            this._postConstructCallbacks.push(callback);
        }
    }

    /**
     * Construct all of the instances that are contained in this collection so that they are ready to be used
     */
    public construct(): void {
        // We don't want to do this multiple times
        if (this._isContructed) {
            throw "InvalidOperationException: Unable to construct the Resolver multiple times";
        }

        // Check over the objects that are included and check to see if we need to inject them
        this._register.enumerateEntries((key, value) => {
            for (let i = 0; i < value.length; ++i) {
                if (!InjectionTargetUtility.isInterface(value[i])) {
                    continue;
                }
                value[i].construct(this);
            }
        });

        // Check over to see if there are any objects we need to initialise
        this._register.enumerateEntries((key, value) => {
            for (let i = 0; i < value.length; ++i) {
                if (!InitialisationUtility.isInterface(value[i])) {
                    continue;
                }
                value[i].init();
            }
        });

        // We're good
        this._isContructed = true;

        // Raise the callbacks that we have stored
        if (this._postConstructCallbacks !== null) {
            for (let i = 0; i < this._postConstructCallbacks.length; ++i) {
                this._postConstructCallbacks[i](this);
            }
            this._postConstructCallbacks = null;
        }
    }

    /**
     * Check to see if there is an element in the resolver hierarchy for the specified value
     * @param key The key of the registration that is being checked
     */
    public hasRegistered(key: string): boolean {
        return this._register.hasKey(key) ||
            (this._parent !== null && this._parent.hasRegistered(key));
    }

    /**
     * Retrieve the object reference that is stored under the specified key
     * @param key The key for the object that is to be looked up
     * @returns Returns the object reference that is stored under the specified key
     */
    public resolve<T>(key: string): T | undefined {
        // If there is no object in the collection under the key, we can't do anything at this level
        if (!this._register.hasKey(key)) {
            // If we have a parent resolver, try and use that
            if (this._parent !== null) {
                return this._parent.resolve<T>(key);
            }

            // If there is no parent, then we fail the resolve
            throw `KeyNotFoundException: Failed to resolve the object reference for the key '${key}'`;
        }

        // Get the collection that is stored under the ID
        let collection = this._register.get(key);
        return collection[0] as T;
    }

    /**
     * Retrieve the registered values that are registered in the container
     * @param key The key that the defined instances are stored under for processing
     * @returns Returns an array of the object instances in the collection that can be used
     */
    public resolveCollection<T>(key: string): T[] | undefined {
        // If there is no object in the collection under the key, we can't do anything at this level
        if (!this._register.hasKey(key)) {
            // If we have a parent resolver, try and use that
            if (this._parent !== null) {
                return this._parent.resolveCollection<T>(key);
            }

            // If there is no parent, then we fail the resolve
            throw `KeyNotFoundException: Failed to resolve the object reference for the key '${key}'`;
        }

        // We can get the collection of elements contained and return them
        return this._register.get(key) as T[];
    }
}

/**
 * Basic implementation of the dependency system that handles the registration and resolving of required elemetns
 */
export class DependencyBuilder implements IDependencyBuilder {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The parent resolver that will be used to look for registrations that don't exist in the current
     */
    private _parent: IDependencyResolver | null;

    /**
     * Store a dictionary of the registered elements that will be made available
     */
    private _register: Dictionary<any[]>;

    /**
     * The existing resolver object that has been created from this container for use
     */
    private _resolver: IDependencyResolver | null = null;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Gets the flag that indicates if this container has been built and is ready to be used
     */
    public get isBuilt(): boolean {
        return this._resolver !== null;
    }

    /**
     * Retrieve the resolver that was created from this builder
     */
    public get resolver(): IDependencyResolver | null {
        return this._resolver;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Setup the initial state of the builder so that it can be used
     */
    public constructor() {
        this._parent = null;
        this._register = new Dictionary<any[]>();
        this._resolver = null;
    }

    /**
     * Assign a parent container to the dependency container that can be used for resolving references
     * @param parent The container object that should be assigned as the parent for this container
     * @returns Returns a reference to itself to be able to chain operations
     */
    public setParent(parent: IDependencyResolver): IDependencyBuilder {
        // If we've already been built, there's nothing we can do
        if (this.isBuilt) {
            throw "Unable to assign parent, container has already been built";
        }
        this._parent = parent;
        return this;
    }

    /**
     * Register an instance of an object that will be included in the container for use
     * @param key The key name that the instance will be registered under so that it can be retrieved
     * @param obj The instance of the object that is to be registered
     * @returns Returns a reference to itself to be able to chain operations
     */
    public registerInstance<T>(key: string, obj: T): IDependencyBuilder {
        // We need to make sure there is a collection stored to add this element to
        if (!this._register.hasKey(key)) {
            this._register.add(key, []);
        }

        // Add this instance to the collection for processing
        let collection = this._register.get(key);
        collection.push(obj);
        return this;
    }

    /**
     * Start the building process that will setup the different elements that are needed for processing
     * @returns Returns a dependency resolver object that can be used to retrieve the different dependency elements
     */
    public build(): IDependencyResolver {
        // If this has already been built, that's a problem
        if (this.isBuilt) {
            throw "OperationInvalidException: Unable to build DependencyContainer, it has already been built";
        }

        // Create the resolver with the elements that will be needed
        this._resolver = new DependencyResolver(this._parent, this._register);
        this._resolver.construct();
        return this._resolver;
    }
}

/**
 * Utility class that can be used to compile the final dependency resolver that will be used for processing elements
 */
export class ScopeCompiler {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Compile the final dependency resolver that can be used, combining multiple levels of scope
     * @param scopes The array of scopes in the order that should be constructed
     * @returns Returns the Dependency Resolver that can be used to perform the required actions
     * @comment Each preceeding scope will be set as the parent on the next
     */
    public static compile(scopes: IScopeConstructor[]): IDependencyResolver | null {
        // We need to track the current resolver in use
        let resolver: IDependencyResolver | null = null;

        // Iterate through the constructors that are to be applied
        for (let i = 0; i < scopes.length; ++i) {
            // Get the builder for this stage of things
            let builder = scopes[i].createScope();

            // If we have a parent, assign it
            if (resolver) {
                builder.setParent(resolver);
            }

            // Now we can build for the resolver at this level
            resolver = builder.build();
        }

        // We have the final collection of scopes to be used
        return resolver;
    }
}
