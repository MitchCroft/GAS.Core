import { Dictionary, JObject } from "../../../Foundation/Objects";
import { ILogger } from "../../../Foundation/Logging";
import { IInjectionTarget, IInitialisable, IDependencyResolver } from "../../../Foundation/DI/Interfaces";
import { Schema } from "../../../Foundation/Schema/Objects";
import { SchemaBuilder } from "../../../Foundation/Schema/Builders";
import { BasicValueValidation, BasicType } from "../../../Foundation/Schema/Validation";
import { IConfigurationProvider } from "../../../Foundation/Configuration";
import { WriteAccessHandler } from "../../Handlers";
import { IEndpointOperation, DefaultEndpointOutputData, IFormatInput, IEndpointController } from "./Interfaces";
import { StringExtensions } from "../../../Foundation/Extensions";

/**
 * Process the input of GoogleAppsScript.Events.DoGet to determine the base input data object that can be processed in operations
 */
export class GetFormatInput implements IFormatInput {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Parse the supplied input data into an generic object that can be processed
     * @param eventData The request object that is to be parsed into a workable data object
     * @returns Returns a generic data object that can be parsed for object operations
     */
    public formatInputData(eventData: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): JObject {
        return this.formatGetInputData(eventData);
    }

    //PRIVATE

    /**
     * Parse the supplied input data into an generic object that can be processed
     * @param eventData The request object that is to be parsed into a workable data object
     * @returns Returns a generic data object that can be parsed for object operations
     */
    private formatGetInputData(eventData: GoogleAppsScript.Events.DoGet): JObject {
        let input: JObject = {};
        for (const prop in eventData.parameter) {
            input[prop] = (eventData.parameters[prop].length > 1 ?
                eventData.parameters[prop] :
                eventData.parameter[prop]
            );
        }
        return input;
    }
}

/**
 * Process the input of GoogleAppsScript.Events.DoPost to determine the base input data object that can be processed in operations
 */
export class PostFormatInput implements IFormatInput {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Parse the supplied input data into an generic object that can be processed
     * @param eventData The request object that is to be parsed into a workable data object
     * @returns Returns a generic data object that can be parsed for object operations
     */
    public formatInputData(eventData: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): JObject {
        return this.formatPostInputData(eventData as GoogleAppsScript.Events.DoPost);
    }

    //PRIVATE

    /**
     * Parse the supplied input data into an generic object that can be processed
     * @param eventData The request object that is to be parsed into a workable data object
     * @returns Returns a generic data object that can be parsed for object operations
     */
    private formatPostInputData(eventData: GoogleAppsScript.Events.DoPost): JObject {
        return JSON.parse(eventData.postData.contents);
    }
}

/**
 * Handler for endpoint operations that need to process incoming request data and generate a result that can be returned to the caller
 */
export class EndpointController implements IInjectionTarget, IInitialisable, IEndpointController {
    /*----------Variables----------*/
    //PROTECTED

    /**
     * The logger interface that will be used for outputting messages as required
     */
    protected _logger: ILogger | null;

    /**
     * The provider that can be used to retrieve the configuration properties for the operation
     */
    protected _configurationProvider: IConfigurationProvider | null;

    //PRIVATE

    /**
     * The configuration property name that will be used to retrieve the authentication token used for verifying request information
     */
    private readonly _authConfigKey: string;

    /**
     * The formatter object that will be used to format the input request data into a usable object
     */
    private readonly _inputFormatter: IFormatInput;

    /**
     * The collection of operations that are available for use with this controller
     */
    private readonly _operations: Dictionary<IEndpointOperation>;

    /**
     * Access guard that will be used to manage the write access of the elements
     */
    private _accessGuard: WriteAccessHandler | null;

    /**
     * The basic schema object that is to be expected of all incoming requests to know how to process the request
     */
    private _basicInputSchema: Schema | null;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Initialise this object with the default object references required
     * @param authConfigKey The configuration parameter that will be used to lookup the authentication token for the request performed
     * @param inputFormatter The input formatter that will be used to parse the input request data into the generic object that can be processed
     */
    public constructor(authConfigKey: string, inputFormatter: IFormatInput) {
        this._logger = null;
        this._configurationProvider = null;
        this._authConfigKey = authConfigKey;
        this._inputFormatter = inputFormatter;
        this._operations = new Dictionary<IEndpointOperation>();
        this._accessGuard = null;
        this._basicInputSchema = null;
    }

    /**
     * Retrieve the required object references for processing the endpoint requests
     * @param resolver The resolver object that will be used to resolve object references
     */
    public construct(resolver: IDependencyResolver): void {
        this._logger = resolver.resolve("ILogger") as ILogger;
        this._configurationProvider = resolver.resolve("IConfigurationProvider") as IConfigurationProvider;
        this._accessGuard = resolver.resolve("WriteAccessHandler") as WriteAccessHandler;

        let operations = resolver.resolveCollectionOptional("IEndpointOperation") as IEndpointOperation[];
        if (operations !== null) {
            for (let i = 0; i < operations.length; ++i) {
                this._logger.log(`Registering operation '${operations[i].name}' for use`);
                this._operations.add(operations[i].name, operations[i]);
            }
        }
    }

    /**
     * Initialise this object so that it's ready to be used
     */
    public init(): void {
        this._basicInputSchema = new SchemaBuilder()
            .addProperty("authToken")
                .addValueValidation(new BasicValueValidation(BasicType.String))
            .addProperty("operation")
                .addValueValidation(new BasicValueValidation(BasicType.String))
            .build();
    }

    /**
     * Verify the incoming data and delegate control to the required operation to generate an output
     * @param eventData The incoming event data that is to be processed and operated on
     * @returns Returns the output object from the operation for use by the caller
     */
    public execute(eventData: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): any {
        // Check that the values have been initialised for use
        if (this._basicInputSchema === null || this._configurationProvider === null || this._accessGuard === null) {
            throw `NullReferenceException: Controller is missing required values, make sure construct and init have been raised before calling`;
        }

        // If something goes wrong, we'll need to handle an error response message
        try {
            // Retrieve the formatted data from the input object
            let inputData = this._inputFormatter.formatInputData(eventData);

            // Validate the input against the minimum expected data
            this._basicInputSchema?.applyDefaultProperties(inputData);
            if (!this._basicInputSchema.isValid(inputData)) {
                return this.createJsonResultObject({
                    code: 422,
                    error: this._basicInputSchema.failureReason,
                    notes: null
                });
            }

            // Check the authentication token against the the specified
            let authToken = this._configurationProvider.getConfigValue(this._authConfigKey);
            if (!StringExtensions.isNullOrEmpty(authToken) && authToken !== inputData.authToken) {
                return this.createJsonResultObject({
                    code: 403,
                    error: "Received authentication token doesn't match",
                    notes: null
                });
            }

            // Check to see if we have an operation that can be used
            if (!this._operations.hasKey(inputData.operation)) {
                return this.createJsonResultObject({
                    code: 404,
                    error: `Invalid operation type '${inputData.operation}'`,
                    notes: null
                });
            }

            // Perform the operation that will be processed
            let operation = this._operations.get(inputData.operation);
            return operation.requiresWrite ? this.executeWriteSaveOperation(operation, inputData) : operation.execute(inputData);
        }

        // Catch any errors to be sent back
        catch (ex: any) {
            this._logger?.exception("An unepected error occurred when processing the incoming response", ex);
            return this.createJsonResultObject({
                code: 500,
                error: "An unexpected exception was thrown while processing the request",
                notes: ex.toString()
            });
        }
    }

    //PRIVATE

    /**
     * Run the specified operation with write safe protections
     * @param operation The operation that is to be executed
     * @param inputData The collection of input data from the caller that is to be processed
     * @returns Returns the output result from the operation to be returned to the caller for handling
     */
    private executeWriteSaveOperation(operation: IEndpointOperation, inputData: JObject): any {
        // If there is no access guard, this can't work
        if (this._accessGuard === null) {
            throw `NullReferenceException: There is no access guard value set to manage access to data`;
        }

        // We need to store the result of the operation to be returned
        let delayedResult: any | null = null;
        this._accessGuard.runAction(() => delayedResult = operation.execute(inputData));

        // We are expecting there to be data received from the operation
        if (delayedResult === null) {
            throw `ArgumentNullException: Didn't receive any result data from the operation '${operation.name}'`;
        }
        return delayedResult;
    }

    /**
     * Create the return object that can be processed by the caller
     * @param payload The payload object that will be added to the handler
     * @returns Returns the output element that will be received by the caller
     */
    private createJsonResultObject(payload: DefaultEndpointOutputData): GoogleAppsScript.Content.TextOutput {
        return ContentService.createTextOutput(JSON.stringify(payload))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
