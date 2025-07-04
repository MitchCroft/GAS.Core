import { JObject } from "../../../Foundation/Objects";
import { Schema } from "../../../Foundation/Schema/Objects";

/**
 * Defines the basic, minimum data that is expected to be included in result data that is returned from an endpoint request
 */
export type DefaultEndpointOutputData = {
    code:   number,
    error:  string | null,
    notes:  string | null,
};

/**
 * Define the basic interface that will be used for all endpoint operations that can be processed
 */
export interface IEndpointOperation {
    /*----------Properties----------*/
    //PUBLIC

    /**
     * The name of the routing option that can be used to run this action
     * @returns Returns the string that can be returned for this operation
     */
    get name(): string;

    /**
     * Flags if this operation requires write protection to avoid race conditions
     * @returns Returns a true if the action performs write operations and needs to be protected
     */
    get requiresWrite(): boolean;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Get a schema that will be run against the input data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the input data is the input object or null to not validate
     */
    getInputSchema(): Schema | null;

    /**
     * Perform the actions that are required for processing this operation
     * @param inputData The input data that has been received from the calling user
     * @returns Returns a JSON object with required information to be sent back to the caller
     * @comment At a minimum, the return object should contain the basic values defined in EndpointBaseController
     */
    execute(inputData: JObject): DefaultEndpointOutputData;

    /**
     * Get a schema that will be run against the result data to ensure that it is valid for use
     * @returns Return the schema that can be used to validate the output data is the input object or null to not validate
     */
    getOutputSchema(): Schema | null;
}
