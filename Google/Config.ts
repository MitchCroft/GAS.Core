import { Dictionary, JObject } from "../Foundation/Objects";
import { IInitialisable, IInjectionTarget, IDependencyResolver } from "../Foundation/DI/Interfaces";
import { IConfigurationProvider, ConfigurationCollection } from "../Foundation/Configuration";
import { SpreadsheetHandler } from "./Handlers";

/**
 * An enumeration that defines the column index values for the expected properties that can be read
 */
enum GoogleSheetConfigurationColumns {
    Key     = 0,
    Value   = 1,
    Notes   = 2
}

/**
 * Object that will contain all of the configuration settings that can be used to drive the application
 */
export class SpreadsheetConfigurationProvider implements IConfigurationProvider, IInitialisable, IInjectionTarget {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The name of the sheet that should be used for processing stored configuration values
     */
    private readonly _sheetName: string;

    /**
     * The utility object that will be used to manage sheet changes
     */
    private _sheetUtility: SpreadsheetHandler | null;

    /**
     * The sheet that contains the collection of values that are to be processed
     */
    private _sheet: GoogleAppsScript.Spreadsheet.Sheet | null;

    /**
     * The range where the existing values were taken from for processing
     */
    private _valueRange: GoogleAppsScript.Spreadsheet.Range | null;

    /**
     * The cached collection of values from the sheet that can be updated and written back as required
     */
    private _values: any[][] | null;

    /**
     * The lookup collection that can be used to look into the cached values and return the required value
     */
    private _lookup: Dictionary<number> | null;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Setup the initial state of the objects that are needed for processing
     * @param sheetName The name of the sheet within the Spreadsheet app that will be used as the configuration source
     */
    public constructor(sheetName: string) {
        this._sheetName = sheetName;
        this._sheetUtility = null;
        this._sheet = null;
        this._valueRange = null;
        this._values = null;
        this._lookup = null;
    }

    /**
     * Retrieve the object defintitions that will be used for processing requests
     * @param resolver The resolver that can be used to retrieve the required object references for processing
     */
    public construct(resolver: IDependencyResolver): void {
        this._sheetUtility = resolver.resolve("SpreadsheetHandler") as SpreadsheetHandler;
    }

    /**
     * Capture the initial values that are needed for the settings to operate properly
     */
    public init(): void {
        // We need to get the configuration sheet where the values should be stored
        if (this._sheetUtility === null) {
            throw `NullReferenceException: The SpreadsheetHandler property hasn't been set`;
        }
        this._sheet = this._sheetUtility.getSheetWithName(this._sheetName);
        if (this._sheet === null) {
            throw `NullReferenceException: Unable to find the config sheet with the expected name '${this._sheetName}'`;
        }

        // Retrieve all of the data that is contained on the sheet
        this._valueRange = this._sheet.getDataRange();
        this._values = this._valueRange.getValues();

        // We can look through the values and find the rows that we are interested in
        this._lookup = new Dictionary<number>();
        for (let i = 1; i < this._values.length; ++i) {
            if (this._values[i][GoogleSheetConfigurationColumns.Key] && !(
                this._values[i][GoogleSheetConfigurationColumns.Value] === null || 
                this._values[i][GoogleSheetConfigurationColumns.Value] === "" || 
                this._values[i][GoogleSheetConfigurationColumns.Value] === undefined)) {
                this._lookup.add(this._values[i][GoogleSheetConfigurationColumns.Key].toString(), i);
            }
        }
    }

    /**
     * Check to see if there is a configuration value with the specified key
     * @param key The configuration value that is to be looked for
     * @returns Returns true if there is a configuration value with the specified key
     */
    public hasConfigValue(key: string): boolean {
        return this._lookup?.hasKey(key) ?? false;
    }

    /**
     * Retrieve a configuration value from the internal collection of values
     * @param key The key that the config value is to be stored under
     * @returns Returns the value that is assigned to the key
     */
    public getConfigValue(key: string): any {
        // Check that the properties have been set for use
        if (this._lookup === null || this._values === null) {
            throw `NullReferenceException: Properties haven't been set before use. Make sure construct and init are called first`;
        }

        // If we don't have a value, that's a problem
        if (!this.hasConfigValue(key)) {
            throw `MissingKeyException: Unable to find a config value with the key '${key}'`;
        }

        // Get the row that the config value exists on
        let row = this._lookup.get(key);

        // Check that we have the range needed for it
        if (row >= this._values.length) {
            throw `IndexOutOfRangeException: The cached row value for '${key}' (${row}) is out of range of the values`;
        }
        if (GoogleSheetConfigurationColumns.Value >= this._values[row].length) {
            throw `IndexOutOfRangeException: The expected value column is out of range of the available values for '${key}' (${row})`;
        }

        // Get the value that can be used
        return this._values[row][GoogleSheetConfigurationColumns.Value];
    }

    /**
     * Retrieve a group of configuration values from the internal collection of values
     * @param collection The collection of configuration values that are to be retrieved. The key is property name that will be returned
     * @returns Returns a generic mapping object with the received content
     */
    public getConfigValues(collection: ConfigurationCollection): JObject {
        let result: JObject = {};
        for (const key in collection) {
            try {
                result[key] = this.getConfigValue(collection[key].Key);
            } catch (ex) {
                if (collection[key].Optional) {
                    result[key] = null;
                } else {
                    throw ex;
                }
            }
        }
        return result;
    }

    /**
     * Update a configuration value that is stored in the collection
     * @param key The key that the config value is to be stored under
     * @param value The new value that is to be assigned to the key
     */
    public setConfigValue(key: string, value: any): void {
        // If the  is null, we have a problem
        if (this._sheet === null || this._lookup === null || this._values === null || this._valueRange === null) {
            throw `NullReferenceException: Unable to update config value '${key}' as properties haven't been set before use. Make sure construct and init are called first`;
        }

        // We can either update a value...
        if (this._lookup.hasKey(key)) {
            // Check to see if the value is actually different
            let row = this._lookup.get(key);
            if (this._values[row][GoogleSheetConfigurationColumns.Value] === value) {
                return;
            }

            // Update the value in the config
            this._values[row][GoogleSheetConfigurationColumns.Value] = value;
            this._valueRange.setValues(this._values);
            return;
        }

        // Or we need to make a new entry for it
        this._sheet.appendRow([ key, value ]);
        this.init();
    }
}
