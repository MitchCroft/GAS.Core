import { IValueValidation } from "./Interfaces";
import { Schema } from "./Objects";

/**
 * Check to see if a value is an array of values
 */
export class ArrayValueValidation implements IValueValidation {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * Cache the complexity score for this validation rule that can be used for processing
     */
    private _complexity: number;

    /**
     * An optional collection of sub-value rules that must be true as well as the value being an array
     * @comment This is an OR operation, only one needs to pass for it to be valid
     */
    private _childRules: IValueValidation[] | null;
        
    /**
     * Store the last reason why the validation failed to be processed
     */
    private _failureReason: string;

    /*----------Properties----------*/
    //PUBLIC
        
    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    public get complexity(): number {
        return this._complexity;
    }

    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    public get displayString(): string {
        return (this._childRules && this._childRules.length > 0 ?
            `[IsArray | ${this._childRules.map(x => x.displayString).join(" | ")}]` :
            `[IsArray]`
        );
    }

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    public get failureReason(): string {
        return this._failureReason;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create this validation element with the expected values
     * @param childRules [Optional] A collection of sub-value rules that will be applied to all values. This is an OR operation, only one needs to pass for it to be valid
     */
    public constructor(childRules: IValueValidation[] | null = null) {
        this._complexity = 2;
        this._failureReason = "";
        this._childRules = childRules;
        if (this._childRules) {
            this._childRules.sort((l, r) => l.complexity - r.complexity);
            for (let i = 0; i < this._childRules.length; ++i) {
                this._complexity += this._childRules[i].complexity;
            }
        }
    }

    /**
     * Validate to check to see if the specified value is of a valid type
     * @param value The value that is being evaluated
     * @returns Returns true if the value is valid according to these rules
     */
    public isValueValid(value: any): boolean {
        // Reset the failure reason
        this._failureReason = "";

        // If the value isn't an array, automatic fail
        if (!Array.isArray(value)) {
            this._failureReason = "Supplied value was not an array";
            return false;
        }

        // Check over the rules that are contained to determine if they can apply
        if (this._childRules) {
            for (let i = 0; i < value.length; ++i) {
                let found = false;
                for (let r = 0; r < this._childRules.length; ++r) {
                    if (this._childRules[r].isValueValid(value[i])) {
                        found = true;
                        break;
                    }
                }

                // If we couldn't find a match, it fails
                if (!found) {
                    this._failureReason = `Array value at index ${i} failed conditions [${this._childRules.map(x => x.failureReason).join(" | ")}]`;
                    return false;
                }
            }
        }

        // If we got this far, it's good
        return true;
    }
}

/**
 * Define the different types of types that can be detected by the validation process
 */
export enum BasicType {
    Undefined   = 0,
    Boolean     = 1,
    Number      = 2,
    String      = 3,
    Symbol      = 4,
    BigInt      = 5,
    Object      = 6,
    Function    = 7
}

/**
 * Check to see if a value is one of the basic value types
 */
export class BasicValueValidation implements IValueValidation {
    /*----------Varaibles----------*/
    //PRIVATE

    /**
     * Store the basic type that is expected for this validation section
     */
    private _expected: BasicType;

    /**
     * Store the last reason why the validation failed to be processed
     */
    private _failureReason: string;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    public get complexity(): number {
        return 2;
    }
        
    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    public get displayString(): string {
        return `value === '${this.expectedString}'`;
    }

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    public get failureReason(): string {
        return this._failureReason;
    }

    //PRIVATE

    /**
     * Retrieve the string representation of the expected type
     */
    private get expectedString(): string {
        switch (this._expected) {
            // The types we expect
            case BasicType.Undefined:   return "undefined";
            case BasicType.Boolean:     return "boolean";
            case BasicType.Number:      return "number";
            case BasicType.String:      return "string";
            case BasicType.Symbol:      return "symbol";
            case BasicType.BigInt:      return "bigint";
            case BasicType.Object:      return "object";
            case BasicType.Function:    return "function";

            // The ones we don't
            default: throw `InvalidValueException: Receieved the invalid value '${this._expected}' when setting up validation rules`;
        }
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create this validator with the expected type for processing
     * @param expected The type that is expected from tested values
     */
    public constructor(expected: BasicType) {
        this._expected = expected;
        this._failureReason = "";
    }

    /**
     * Validate to check to see if the specified value is of a valid type
     * @param value The value that is being evaluated
     * @returns Returns true if the value is valid according to these rules
     */
    public isValueValid(value: any): boolean {
        this._failureReason = "";
        let valueType = typeof value;
        if (valueType === this.expectedString) {
            return true;
        }
        this._failureReason = `Value was of type '${valueType}' when was expecting '${this.expectedString}'`;
        return false;
    }
}

/**
 * Allow for the inverse of any IValueValidation rule to be used
 */
export class InverseValueValidation implements IValueValidation {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The rule that will be inverse tested
     */
    private _rule: IValueValidation;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    public get complexity(): number {
        return 1 + this._rule.complexity;
    }

    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    public get displayString(): string {
        return `!(${this._rule.displayString})`;
    }

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    public get failureReason(): string {
        return `${this._rule.displayString} was valid`;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Define the rule that is to be inverted when testing
     * @param rule The rule that will be inverted for testing
     */
    public constructor(rule: IValueValidation) {
        this._rule = rule;
    }

    /**
     * Validate to check to see if the specified value is of a valid type
     * @param value The value that is being evaluated
     * @returns Returns the inverse of the contained rule for proccessing
     */
    public isValueValid(value: any): boolean {
        return !this._rule.isValueValid(value);
    }
}

/**
 * Check to see if the value that is supplied is a null value
 */
export class NullValueValidation implements IValueValidation {
    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    public get complexity(): number {
        return 1;
    }

    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    public get displayString(): string {
        return "value === null";
    }

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    public get failureReason(): string {
        return "Value was not null";
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Validate to check to see if the specified value is null
     * @param value The value that is being evaluated
     * @returns Returns true if the value is null
     */
    public isValueValid(value: any): boolean {
        return value === null;
    }
}

/**
 * Check to see if an object property has a specific schema
 */
export class SubObjectValueValidation implements IValueValidation {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The schema that the property field can be compared against
     */
    private _schema: Schema;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Get a representation of the complexity of the validation process
     * @returns Returns a numerical representation of the complexity of the evaluation operation
     * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
     */
    public get complexity(): number {
        return this._schema.complexity;
    }

    /**
     * Get the display string representation of the object for debugging
     * @returns Returns a string that describes the action of the object
     */
    public get displayString(): string {
        return this._schema.displayString;
    }

    /**
     * Get the last reason why a validation attempt failed
     * @returns Returns a string describing the error that occurred when processing the object
     * @comment This can be used to poll why validation failed
     */
    public get failureReason(): string {
        return this._schema.failureReason;
    }

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create the validation rule with the specified values
     * @param schema The schema that the checked against values will be compared to
     */
    public constructor(schema: Schema) {
        this._schema = schema;
    }

    /**
     * Validate to check to see if the specified value is of a valid type
     * @param value The value that is being evaluated
     * @returns Returns an object that describes the result of the validation test operation
     */
    public isValueValid(value: any): boolean {
        return this._schema.isValid(value);
    }
}