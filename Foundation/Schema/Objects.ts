import { JObject, Dictionary } from "../Objects";
import { IValidateObject, ISchemaProperty, IValueValidation } from "./Interfaces";

/**
 * Defines a collection of properties that are expected for an object to have that can be validated
 */
export class Schema implements IValidateObject {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The collection of properties that are expected to be in a tested object
     */
    private _properties: ISchemaProperty[];

    /**
     * Cache the complexity of the elements within the schema for processing
     */
    private _complexity: number;

    /**
     * The last reason why an object schema validation failed for testing
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
        return `{\n\t${this._properties.map(x => `"${x.name}": "${x.displayString}"`).join("\n\t")}\n}`;
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
     * Create this object with the collection of properties that are to be managed
     * @param properties The collection of properties that will be evaluated in this 
     */
    public constructor(properties: ISchemaProperty[]) {
        // There need to be properties to test
        if (!properties || properties.length === 0) {
            throw "ArgumentNullException: There were no properties supplied to the object schema for use";
        }

        // Set the starting values
        this._properties = properties;
        this._complexity = 1;
        this._failureReason = "";

        // Add up the collection of properties for the final complexity score
        for (let i = 0; i < this._properties.length; ++i) {
            this._complexity += this._properties[i].complexity;
        }
    }

    /**
     * Try to apply the nominated default property values to the object if they are currently invalid for their defined rules
     * @param obj The object that will have default property values assigned
     */
    public applyDefaultProperties(obj: JObject): void {
        for (let i = 0; i < this._properties.length; ++i) {
            this._properties[i].testApplyDefault(obj);
        }
    }

    /**
     * Validate that the supplied object meets the required conditions
     * @param obj The object that is to be checked over
     * @returns Returns true if the object passes the validation process
     */
    public isValid(obj: JObject): boolean {
        // Clear any previous failure reason that is no longer required
        this._failureReason = "";

        // We need to make sure that all properties that are in the schema are valid
        let success = true;
        for (let i = 0; i < this._properties.length; ++i) {
            // If the property could be validated, we don't need to worry about it
            if (this._properties[i].isValid(obj)) {
                continue;
            }

            // Otherwise, we have a problem
            success = false;
            if (this._failureReason === "") {
                this._failureReason = this._properties[i].failureReason;
            } else {
                this._failureReason += `\n${this._properties[i].failureReason}`;
            }
        }
        return success;
    }
}

/**
 * A collection of schema options that data can take, allowing for the matching the required one for processing
 */
export class SchemaCollection {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The collection of schema elements that can be selected from in the collection
     */
    private _options: Dictionary<Schema>;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create the collection of schema options that can be matched against
     */
    public constructor() {
        this._options = new Dictionary<Schema>();
    }

    /**
     * Check to see if this collection has a schema registered under the specified name
     * @param key The key that the specified schema is stored under to be checked
     */
    public hasSchema(key: string): boolean {
        return this._options.hasKey(key);
    }

    /**
     * Retrieve the schema from the collection that is stored under the specified entry
     * @param key The key of the specified schema that is to be retrieved
     * @returns Returns the Schema object that is stored under the specified key or null if none
     */
    public getSchema(key: string): Schema | null {
        return (this._options.hasKey(key) ? this._options.get(key) : null);
    }

    /**
     * Add a schema to the internal collection of options to test against
     * @param key The key that the specified schema should be stored under
     * @param schema The schema object that will be validated against when performing checks
     */
    public addSchema(key: string, schema: Schema): void {
        this._options.add(key, schema);
    }

    /**
     * Forcibly add a schema to the internal collection of options in a way that will replace a pre-existing entry
     * @param key The key that the specified schema should be stored under
     * @param schema The schema object that will be validated against when performing checks
     */
    public replaceSchema(key: string, schema: Schema): void {
        this._options.replace(key, schema);
    }

    /**
     * Remove a schema from the collection of elements to validate against
     * @param key The key of the schema that is to be removed from the collection
     * @returns Returns true if a schema with the matching name could be found and removed
     */
    public remove(key: string): boolean {
        return this._options.remove(key);
    }

    /**
     * Get the collection of keys for schemas that are defined in this collection
     * @returns Returns an array of the keys that are used for storing schema
     */
    public getSchemaKeys(): string[] {
        return this._options.getKeys();
    }

    /**
     * Check the supplied object against the contained schema to look for a match that can be handled
     * @param obj The object that is to be evaluated to look for a match
     * @returns Returns a tuple that describes the result of the search, with the first value being a flag to indicate if a match was found and the second the key of the schema that was a match
     */
    public validateObjectSchema(obj: JObject): [boolean, string?] {
        // Check over all of the schema that need to be validated against
        for (const key of this._options.getKeys()) {
            // We need to check to see if the object can be matched against the schema
            if (this._options.get(key).isValid(obj)) {
                return [true, key];
            }
        }

        // If we made it this far, we couldn't find a match
        return [false];
    }
}
