import { JObject } from "../Objects";

/**
 * Interface that can be used to retrieve the complexity of the validation elements
 */
export interface IComplexity {
    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    get complexity(): number;
}

/**
 * An interface for information that is generated when validating schema to allow for compiling failure messages
 */
export interface IDebugInformation {
    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    get displayString(): string;

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    get failureReason(): string;
}

/**
 * Defines an element that will be used to validate incoming data values
 */
export interface IValidateObject extends IDebugInformation, IComplexity {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Validate that the supplied object meets the required conditions
     * @param obj The object that is to be checked over
     * @returns Returns true if the object passes the validation process
     */
    isValid(obj: JObject): boolean;
}

/**
 * Basic interface that marks a property object that can be added to a schema
 */
export interface ISchemaProperty extends IValidateObject {
    /*----------Properties----------*/
    //PUBLIC

    /**
     * The name of the property that is being processed
     * @returns Returns a string of the property that is represented by this entry
     */
    get name(): string;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Check to see if the default value for this property should be applied to the supplied object
     * @param obj The object that is being tested and will be modified based on requirements
     * @comment This should only apply the default if the application would normally fail
     */
    testApplyDefault(obj: JObject): void;
}

/**
 * Interface for an object that can be used to validate if a value is a valid type
 */
export interface IValueValidation extends IDebugInformation, IComplexity {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Validate to check to see if the specified value is of a valid type
     * @param value The value that is being evaluated
     * @returns Returns an object that describes the result of the validation test operation
     */
    isValueValid(value: any): boolean;
}
