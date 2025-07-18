import { JObject } from "../../../Foundation/Objects";
import { ILogger } from "../../../Foundation/Logging";
import { IInjectionTarget, IDependencyResolver } from "../../../Foundation/DI/Interfaces";
import { IConfigurationProvider } from "../../../Foundation/Configuration";
import { Schema } from "../../../Foundation/Schema/Objects";
import { DefaultEndpointOutputData, IEndpointOperation } from "./Interfaces";

/**
 * Defines an endpoint routing option that can be raised from any of the end point triggers
 */
export abstract class BaseEndpointOperation<TInput, TOutput extends DefaultEndpointOutputData = DefaultEndpointOutputData> implements IEndpointOperation, IInjectionTarget {
    /*----------Variables----------*/
    //PROTECTED

    /**
     * The logger that can be used to output information during operation
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
     * Initialise the object with the default references
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
     * Get a schema that will be run against the input data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the input data is the input object or null to not validate
     */
    public abstract getInputSchema(): Schema | null;

    /**
     * Perform the actions that are required for processing this operation
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a JSON object with required information to be sent back to the caller
     * @comment At a minimum, the return object should contain the basic values defined in EndpointBaseController
     */
    public execute(inputData: JObject): DefaultEndpointOutputData {
        // Wrap this in a try so if something goes wrong we can be more informative
        try { return this.performOperation(inputData as TInput); }

        // Anything goes wrong, return a slightly less generic error object
        catch (ex) {
            return {
                code: 500,
                error: `An unexpected exception was thrown while processing the request: ${ex}`,
                notes: this.name
            };
        }
    }
        
    /**
     * Get a schema that will be run against the result data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the output data is the input object or null to not validate
     */
    public abstract getOutputSchema(): Schema | null;

    //PROTECTED

    /**
     * Run the required operation after all of the input data has been validated is ready for use
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a JSON object with required information to be sent back to the caller
     * @comment At a minimum, the return object should contain the basic values defined in EndpointBaseController
     */
    protected abstract performOperation(inputData: TInput): TOutput;

    /**
     * Ensure that the value that is used is an array of values
     * @param value The value that is to be checked, either an array of value
     * @returns Returns an array of the values that can be processed
     */
    protected getAsArray<T>(value: T | T[]): T[] {
        return (Array.isArray(value) ? value : [value]);
    }
}
