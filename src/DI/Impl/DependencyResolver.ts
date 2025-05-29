namespace MC.GAS.DI {
    /**
     * Defines an object that has been setup with registered elements that can be supplied resolved for use
     */
    export class DependencyResolver implements IDependencyResolver {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The parent resolver that has been assigned to this 
         */
        private _parent: IDependencyResolver;

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
        private _postConstructCallbacks: PostConstructionCallback[];

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
        public constructor(parent: IDependencyResolver, register: Dictionary<any[]>) {
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
            this._postConstructCallbacks.push(callback);
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
            for (let i = 0; i < this._postConstructCallbacks.length; ++i) {
                this._postConstructCallbacks[i](this);
            }
            this._postConstructCallbacks = null;
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
}
