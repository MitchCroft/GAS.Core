namespace MC.GAS.DI {
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
        public static compile(scopes: IScopeConstructor[]): IDependencyResolver {
            // We need to track the current resolver in use
            let resolver: IDependencyResolver = null;

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
}
