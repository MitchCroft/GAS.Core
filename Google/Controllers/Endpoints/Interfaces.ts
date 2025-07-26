import { JObject } from "../../../Foundation/Objects";

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
     * Perform the actions that are required for processing this operation
     * @param inputData The input data that has been received from the calling user
     * @returns Returns the text output of the operation that can be delivered back to the caller
     */
    execute(inputData: JObject): any;
}

/**
 * Parse incoming input data and process it into a generic object that can be supplied to operations for processing
 */
export interface IFormatInput {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Parse the supplied input data into an generic object that can be processed
     * @param eventData The request object that is to be parsed into a workable data object
     * @returns Returns a generic data object that can be parsed for object operations
     */
    formatInputData(eventData: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): JObject;
}

/**
 * Main controller type that will be used to perform the endpoint operation and action the data
 */
export interface IEndpointController {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Parse and perform the endpoint operations
     * @param eventData The collection of information that was received from the caller for processing
     * @returns Returns the output object for the operation that was performed
     */
    execute(eventData: GoogleAppsScript.Events.AppsScriptHttpRequestEvent): any;
}
