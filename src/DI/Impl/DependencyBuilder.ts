namespace MC.GAS.DI {
    /**
     * Basic implementation of the dependency system that handles the registration and resolving of required elemetns
     */
    export class DependencyBuilder implements IDependencyBuilder {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The parent resolver that will be used to look for registrations that don't exist in the current
         */
        private _parent: IDependencyResolver;

        /**
         * Store a dictionary of the registered elements that will be made available
         */
        private _register: Dictionary<any[]>;

        /**
         * The existing resolver object that has been created from this container for use
         */
        private _resolver: IDependencyResolver = null;

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
        public get resolver(): IDependencyResolver {
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
}
