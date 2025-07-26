import { JObject } from "../../../Foundation/Objects";
import { ILogger } from "../../../Foundation/Logging";
import { IInjectionTarget, IDependencyResolver } from "../../../Foundation/DI/Interfaces";
import { IConfigurationProvider } from "../../../Foundation/Configuration";
import { Schema } from "../../../Foundation/Schema/Objects";
import { DefaultEndpointOutputData, IEndpointOperation } from "./Interfaces";

/**
 * Defines the base operation endpoint class that will be used for processing external requests
 */
export abstract class BaseEndpointOperation<TInput> implements IEndpointOperation, IInjectionTarget {
    /*----------Variables----------*/
    //PROTECTED

    /**
     * The logger that can be used to output information during processing operations
     */
    protected _logger: ILogger | null;

    /**
     * The configuration provider that will be used to retrieve properties needed for operation
     */
    protected _configurationProvider: IConfigurationProvider | null;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * The name of the routing option that can be used to run this action
     * @returns Returns the string that can be returned for this operation
     */
    public abstract get name(): string;

    /**
     * Flags if this operation requires write protection to avoid race conditions
     * @returns Returns a true if the action performs write operations and needs to be protected
     */
    public get requiresWrite(): boolean {
        return false;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create the object with the default values
     */
    public constructor() {
        this._logger = null;
        this._configurationProvider = null;
    }
    
    /**
     * Retrieve the required object references for processing the endpoint requests
     * @param resolver The resolver object that will be used to resolve object references
     */
    public construct(resolver: IDependencyResolver): void {
       this._logger = resolver.resolve("ILogger") as ILogger;
       this._configurationProvider = resolver.resolve("IConfigurationProvider") as IConfigurationProvider;
    }

    /**
     * Perform the actions that are required for processing this operation
     * @param inputData The input data that has been received from the calling user
     * @returns Returns the output of the operation that can be delivered back to the caller
     */
    public execute(inputData: JObject): any {
        // We want to try and process the data that has been received for this specific operation
        try {
            // If there is an input schema, we can check that the input values are good
            let inputSchema = this.getInputSchema();
            if (inputSchema !== null) {
                inputSchema.applyDefaultProperties(inputData);
                if (!inputSchema.isValid(inputData)) {
                    return this.createJsonResultObject({
                        code: 422,
                        error: inputSchema.failureReason,
                        notes: this.name
                    });
                }
            }

            // Run the process that is needed
            return this.performOperation(inputData as TInput);
        }

        // Anything going wrong is a problem
        catch (ex: any) {
            this._logger?.exception(`Encounterd an exception when processing '${this.name}'`, ex);
            return this.createJsonResultObject({
                code: 500,
                error: `An unexpected exception was thrown while processing the request '${this.name}'`,
                notes: ex.toString()
            });
        }
    }

    //PROTECTED

    /**
     * Get a schema that will be run against the input data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the input data is the input object or null to not validate
     */
    protected abstract getInputSchema(): Schema | null;

    /**
     * Run the required operation after all of the input data has been validated is ready for use
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a result object of the operation that has been processed for operation
     */
    protected abstract performOperation(inputData: TInput): any;

    /**
     * Create the return object that can be processed by the caller
     * @param payload The payload object that will be added to the handler
     * @returns Returns the output element that will be received by the caller
     */
    protected createJsonResultObject(payload: DefaultEndpointOutputData): GoogleAppsScript.Content.TextOutput {
        return ContentService.createTextOutput(JSON.stringify(payload))
            .setMimeType(ContentService.MimeType.JSON);
    }

    /**
     * Ensure that the value that is used is an array of values
     * @param value The value that is to be checked, either an array of value
     * @returns Returns an array of the values that can be processed
     */
    protected getAsArray<T>(value: T | T[]): T[] {
        return (Array.isArray(value) ? value : [value]);
    }
}

/**
 * Defines the base operation endpoint class that can be used for JSON return operations
 */
export abstract class BaseJsonEndpointOperation<TInput, TOutput extends DefaultEndpointOutputData = DefaultEndpointOutputData> extends BaseEndpointOperation<TInput> {
    /*----------Functions----------*/
    //PROTECTED

    /**
     * Run the required operation after all of the input data has been validated is ready for use
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a result object of the operation that has been processed for operation
     */
    protected performOperation(inputData: TInput): any {
        // We want to retrieve the data object for this operation
        let operationResult = this.gatherJsonResult(inputData);

        // We can check to see if there is an output schema that needs to be applied
        let outputSchema = this.getOutputSchema();
        if (outputSchema !== null) {
            outputSchema.applyDefaultProperties(operationResult);
            if (!outputSchema.isValid(operationResult)) {
                return this.createJsonResultObject({
                    code: 422,
                    error: `Return object failed to meet schema requirements: ${outputSchema.failureReason}`,
                    notes: JSON.stringify(operationResult)
                });
            }
        }

        // We have the result of the operation that can be returned for use
        return this.createJsonResultObject(operationResult);
    }
       
    /**
     * Get a schema that will be run against the result data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the output data is the input object or null to not validate
     */
    protected abstract getOutputSchema(): Schema | null;

    /**
     * Handle the process of gathering the JSON result object that can be formatted and returned to the caller
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a result object that can be formatted into the expected JSON output structure
     */
    protected abstract gatherJsonResult(inputData: TInput): TOutput;
}
