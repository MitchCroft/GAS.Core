namespace MC.GAS.Controllers.Endpoints {
    /**
     * Base class that will be used for processing the required functionality of the 
     */
    export abstract class BaseEndpointController<T extends GoogleAppsScript.Events.AppsScriptHttpRequestEvent> implements MC.GAS.DI.IInjectionTarget, MC.GAS.DI.IInitialisable {
        /*----------Variables----------*/
        //PROTECTED

        /**
         * The logger interface that will be used for outputting messages as required
         */
        protected _logger: MC.GAS.Logging.ILogger;

        /**
         * The provider that can be used to retrieve the required configuration properties for operation
         */
        protected _configurationProvider: MC.GAS.Config.IConfigurationProvider;

        //PRIVATE

        /**
         * Access guard that will be used to manage the write access of the elements
         */
        private _accessGuard: MC.GAS.Handlers.WriteAccessHandler;

        /**
         * Lookup collection of the different operations that are available for processing
         */
        private _operations: MC.GAS.Dictionary<IEndpointOperation>;

        /**
         * The default schema objects that are expected to be used for every type of request that is processed
         */
        private _basicInputSchema: MC.GAS.Schema.Schema;
        private _basicReturnSchema: MC.GAS.Schema.Schema;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Intialise this object with the default object references
         */
        public constructor() {
            this._logger = null;
            this._configurationProvider = null;
            this._accessGuard = null;
            this._operations = null;
            this._basicInputSchema = null;
            this._basicReturnSchema = null;
        }

        /**
         * Retrieve the required object references for processing the endpoint requests
         * @param resolver The resolver object that will be used to resolve object references
         */
        public construct(resolver: MC.GAS.DI.IDependencyResolver): void {
            this._logger = resolver.resolve("ILogger") as MC.GAS.Logging.ILogger;
            this._configurationProvider = resolver.resolve("IConfigurationProvider") as MC.GAS.Config.IConfigurationProvider;
            this._accessGuard = resolver.resolve("WriteAccessHandler") as MC.GAS.Handlers.WriteAccessHandler;
            let operations = resolver.resolveCollection("IEndpointOperation") as IEndpointOperation[];
            this._operations = new MC.GAS.Dictionary<IEndpointOperation>();
            for (let i = 0; i < operations.length; ++i) {
                this._logger.log(`Registering operation '${operations[i].name}' for use`);
                this._operations.add(
                    operations[i].name,
                    operations[i]
                );
            }
        }

        /**
         * Initialise this object so that it's ready to be used
         */
        public init(): void {
            this._basicInputSchema = new Schema.SchemaBuilder()
                .addProperty("authToken")
                    .addValueValidation(new Schema.BasicValueValidation(Schema.BasicType.String))
                .addProperty("operation")
                    .addValueValidation(new Schema.BasicValueValidation(Schema.BasicType.String))
                .build();
            this._basicReturnSchema = new Schema.SchemaBuilder()
                .addProperty("code")
                    .addValueValidation(new Schema.BasicValueValidation(Schema.BasicType.Number))
                    .withDefault(500)
                .addProperty("error")
                    .addValueValidation(new Schema.BasicValueValidation(Schema.BasicType.String))
                    .addValueValidation(new Schema.NullValueValidation())
                    .withDefault(null)
                .addProperty("notes")
                    .addValueValidation(new Schema.BasicValueValidation(Schema.BasicType.String))
                    .addValueValidation(new Schema.NullValueValidation())
                    .withDefault(null)
                .build();
        }

        /**
         * Perform the collection of actions that can be delegated to based on the controller contents
         * @param eventData The event data that is received from the root request that was made
         * @returns Returns the output JSON data from the operation that was run
         */
        public execute(eventData: T): GoogleAppsScript.Content.TextOutput {
            // No matter what happens, we want to handle a return object
            let operationOutputSchema: MC.GAS.Schema.Schema = null;
            try {
                // We need to format the event data into a JSON object that we can use for processing requests
                let inputData = this.retrieveInputData(eventData);

                // Validate the input data against the minimum expected
                this._basicInputSchema.applyDefaultProperties(inputData);
                if (!this._basicInputSchema.isValid(inputData)) {
                    return this.formatResultObject({
                        code: 422,
                        error: this._basicInputSchema.failureReason,
                        notes: null
                    });
                }

                // Check the authentication token supplied against the supplied
                let requiredAuthToken = this.getAuthenticationToken();
                if (requiredAuthToken !== null && requiredAuthToken !== inputData.authToken) {
                    return this.formatResultObject({
                        code: 403,
                        error: "Received authentication token doesn't match",
                        notes: null
                    });
                }

                // We need to check if there is a nominated operation to run
                if (!this._operations.hasKey(inputData.operation)) {
                    return this.formatResultObject({
                        code: 400,
                        error: `Invalid operation type '${inputData.operation}'`,
                        notes: null
                    });
                }

                // We can get the operation to do additional checks
                let operation = this._operations.get(inputData.operation);
                operationOutputSchema = operation.getOutputSchema();

                // If there is an input schema, check to make sure the values are good
                let operationInputSchema = operation.getInputSchema();
                if (operationInputSchema !== null) {
                    operationInputSchema.applyDefaultProperties(inputData);
                    if (!operationInputSchema.isValid(inputData)) {
                        return this.formatResultObject(
                            {
                                code: 422,
                                error: operationInputSchema.failureReason,
                                notes: operation.name
                            },
                            operationOutputSchema
                        );
                    }
                }

                // Run the operation and handle the result format
                return this.formatResultObject(
                    operation.requiresWrite ? this.executeWriteSafeOperation(operation, inputData) : operation.execute(inputData),
                    operationOutputSchema
                );
            }

            // If anything goes wrong, we're just going to return the error result
            catch (ex) {
                return this.formatResultObject(
                    {
                        code: 500,
                        error: `An unexpected exception was thrown while processing the request\n${ex}`,
                        notes: null
                    },
                    operationOutputSchema
                );
            }
        }

        //PROTECTED

        /**
         * Allows implementing classes to format the supplied data and return a generic object that can be processed
         * @param eventData The event data object that has been passed and needs to be processed
         * @returns Returns the JSON object with all the values sent by the user ready to be processed
         */
        protected abstract retrieveInputData(eventData: T): MC.GAS.JObject;

        /**
         * Retrieve the authentication token that must be matched against for the required endpoint to work
         * @returns Returns a string that will be matched against the supplied input data or null if no authentication is required
         */
        protected abstract getAuthenticationToken(): string;

        //PRIVATE

        /**
         * Run the specified operation with write safe protections
         * @param operation The operation that is to be executed
         * @param inputData The collection of input data from the caller that is to be processed
         * @returns Returns the output object that can be returned to the caller for processing
         */
        private executeWriteSafeOperation(operation: IEndpointOperation, inputData: MC.GAS.JObject): MC.GAS.Controllers.Endpoints.DefaultEndpointOutputData {
            // We need to get a result from this operation
            let delayedResult: MC.GAS.Controllers.Endpoints.DefaultEndpointOutputData = null;

            // Wait for write access to the data
            this._accessGuard.runAction(() => delayedResult = operation.execute(inputData));

            // We are expecting there to be data retrieved from the operation
            if (delayedResult === null) {
                throw `NullReferenceException: Didn't receive any result data from the operation '${operation.name}'`;
            }
            return delayedResult;
        }

        /**
         * Validate the return object to ensure it has the required elements before returning it to the caller
         * @param payload The payload return object that will be processed for return to the caller
         * @param resultSchema [Optional] And additional return schema that will be applied to returned elements for validation
         * @returns Returns the output element that will be received by the caller
         */
        private formatResultObject(payload: MC.GAS.Controllers.Endpoints.DefaultEndpointOutputData, resultSchema: MC.GAS.Schema.Schema | null = null): GoogleAppsScript.Content.TextOutput {
            // Find the collection of schema that are needed for processing
            let formatSchema = (resultSchema ? 
                [ resultSchema, this._basicReturnSchema ] :
                [ this._basicReturnSchema ]
            );

            // We want to iterate through and make sure that all schema are satisfied
            for (let i = 0; i < formatSchema.length; ++i) {
                formatSchema[i].applyDefaultProperties(payload);
                if (!formatSchema[i].isValid(payload)) {
                    return this.formatResultObject({
                        code: 422,
                        error: `Return object failed to meet schema requirements\n${formatSchema[i].failureReason}`,
                        notes: JSON.stringify(payload)
                    });
                }
            }
            return this.createResultObject(payload);
        }

        /**
         * Create the return object that can be processed by the caller
         * @param payload The payload object that will be added to the handler
         * @returns Returns the output element that will be received by the caller
         */
        private createResultObject(payload: MC.GAS.JObject): GoogleAppsScript.Content.TextOutput {
            return ContentService.createTextOutput(JSON.stringify(payload))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }
}
