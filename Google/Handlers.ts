import { Mapping } from "../Foundation/Objects";
import { StringExtensions } from "../Foundation/Extensions";
import { IInitialisable } from "../Foundation/DI/Interfaces";

/**
 * Basic interface for locking write access to the sheet to prevent race condition operations
 */
export class WriteAccessHandler {
    /*----------Variables----------*/
    //CONST

    /**
     * The length of time that the process can wait for before trying to process the request
     */
    private readonly LOCK_OUT_PERIOD = 60000; // 60s

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Attempt to lock write access to the application and then run the callback action
     * @param callback The callback function that is to be raised when access is available
     */
    public runAction(callback: (() => void)): void {
        // We need to get the lock to prevent duplicate modifications
        let lock = LockService.getScriptLock();
        try {
            lock.waitLock(this.LOCK_OUT_PERIOD);
            callback();
        }

        // Once everything is handled, we need to release the lock
        finally {
            SpreadsheetApp.flush();
            lock.releaseLock();
        }
    }
}

/**
 * A collection of utility functions that can be used when processing Google Sheets
 */
export class SpreadsheetHandler implements IInitialisable {
    /*----------Variables---------*/
    //PRIVATE

    /**
     * Cache the active spreadsheet that is being processed
     */
    private _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | null;

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Create this object with the default values
     */
    public constructor() {
        this._spreadsheet = null;
    }

    /**
     * Initialise the starting values that are needed for processing
     */
    public init(): void {
        this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    /**
     * 
     * @param name The name of the sheet that is being looked for
     */
    public sheetExistsWithName(name: string): boolean {
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        return this._spreadsheet.getSheetByName(name) !== null;
    }

    /**
     * Retrieve a reference to the sheet with the specified name
     * @param name The name of the sheet that is to be retrieved
     * @returns Returns the sheet with a name that matches the specified or null if unable to find
     */
    public getSheetWithName(name: string): GoogleAppsScript.Spreadsheet.Sheet | null {
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        return this._spreadsheet.getSheetByName(name);
    }

    /**
     * Retrieve the sheet in the current spreadhseet with the specified tag
     * @param key The key that the meta data has been assigned to
     * @param value The value of the key that is being searched for
     * @returns Returns the collection of sheets with meta data that match the meta data
     */
    public getSheetsWithMetaData(key: string, value: string): GoogleAppsScript.Spreadsheet.Sheet[] {
        // Try to find all of the sheets that have the meta data elements
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        let foundSheets = this._spreadsheet.createDeveloperMetadataFinder()
            .withKey(key)
            .withValue(value)
            .withLocationType(SpreadsheetApp.DeveloperMetadataLocationType.SHEET)
            .withVisibility(SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT)
            .find();

        // This search can return ghost/orphaned data, restrict the return results to only live data
        let sheets: GoogleAppsScript.Spreadsheet.Sheet[] = [];
        for (let i = 0; i < foundSheets.length; ++i) {
            // Check that the sheet is valid
            let location = foundSheets[i].getLocation();
            if (!location) {
                continue;
            }
            let sheet = location.getSheet();
            if (!sheet || StringExtensions.isNullOrEmpty(sheet.getName())) {
                continue;
            }

            // Add the sheet to the list of available options
            sheets.push(sheet);
        }
        return sheets;
    }

    /**
     * Create a new Sheet in the current Spreadsheet
     * @param name The name that should be assigned to the newly created sheet
     * @param metaData [Optional] A lookup collection of the meta data that should be assigned to the newly created sheet
     * @returns Returns a new instance of a blank sheet that can be used for processing
     */
    public createSheet(name: string, metaData: Mapping<string> = {}): GoogleAppsScript.Spreadsheet.Sheet {
        // Insert a new sheet with the specified name
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        let newSheet = this._spreadsheet.insertSheet(
            name,
            this._spreadsheet.getNumSheets()
        );
        this._spreadsheet.setActiveSheet(newSheet);

        // Add the meta data to the sheet
        for (const prop in metaData) {
            if (!metaData.hasOwnProperty(prop)) {
                continue;
            }
            newSheet.addDeveloperMetadata(
                prop,
                metaData[prop],
                SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT
            );
        }
        return newSheet;
    }

    /**
     * Create a copy of an existing sheet that can be used for populating data
     * @param template The template sheet that is to be duplicated for use
     * @param name The name that is to be given to the new sheet for use
     * @param metaData [Optional] A lookup collection of the meta data that should be assigned to the newly created sheet
     * @returns Returns a new instance of the copied template sheet that can be used. Sheet is made active and placed at the end of all sheets
     */
    public duplicateSheet(template: GoogleAppsScript.Spreadsheet.Sheet, name: string, metaData: Mapping<string> = {}): GoogleAppsScript.Spreadsheet.Sheet {
        // Create the new copy of the sheet
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        let newSheet = template.copyTo(this._spreadsheet);
        newSheet.setName(name);
        newSheet.showSheet();
        this._spreadsheet.setActiveSheet(newSheet);
        this._spreadsheet.moveActiveSheet(this._spreadsheet.getNumSheets());

        // Add the meta data to the sheet
        for (const prop in metaData) {
            if (!metaData.hasOwnProperty(prop)) {
                continue;
            }
            newSheet.addDeveloperMetadata(
                prop,
                metaData[prop],
                SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT
            );
        }
        return newSheet;
    }

    /**
     * Convert a column index value to a alphabetical column representation
     * @param column The index that is to be converted
     * @returns Returns the string letter notation for the corresponding column
     */
    public columnToLetter(column: number): string {
        var temp, letter = "";
        while (column > 0) {
            temp = (column - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            column = (column - temp - 1) / 26;
        }
        return letter;
    }

    /**
     * Convert from a column letter notation to an index
     * @param letter The column letter notation that is to be converted
     * @returns Returns the index that corresponds to the column
     */
    public letterToColumn(letter: string): number {
        let column = 0, length = letter.length;
        for (let i = 0; i < length; ++i) {
            column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
        }
        return column;
    }

    /**
     * Find the index of the next row that is empty and return the index
     * @param sheet The sheet that is being looked for
     * @param startRowIndex The starting index where the search should happen from
     * @param startColumnIndex The index of the column where the search should start from
     * @param rangeSize The number of columns that are to be captured for testing if they are blank
     * @param endingRowIndex [Optional] An ending row index that should be stopped at when searching for the next blank row
     * @returns Returns the index of the next blank index or the end bounds if none
     */
    public findNextEmptyRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, startRowIndex: number, startColumnIndex: number, rangeSize: number, endingRowIndex?: number | undefined): number {
        // Find the columns that we will be dealing with
        let startColumn = this.columnToLetter(startColumnIndex);
        let endColumn = this.columnToLetter(startColumnIndex + rangeSize - 1);

        // Get the range that we are going to be searching
        let hasDefinedEnd = typeof endingRowIndex === "number";

        // Find out how many rows there are across the range to be searched
        let region = (hasDefinedEnd ?
            sheet.getRange(`${startColumn}${startRowIndex}:${endColumn}${endingRowIndex}`) :
            sheet.getRange(`${startColumn}${startRowIndex}:${endColumn}`)
        );

        // If there is no defined end, we can use the number of rows in the region
        if (!hasDefinedEnd) {
            endingRowIndex = startRowIndex + region.getNumRows();
        }

        // If the ending index is less then the start, nothing we can do
        if (endingRowIndex! <= startRowIndex) {
            return -1;
        }

        // Get the values to look through
        let regionValues = region.getValues();
        for (let r = 0; r < regionValues.length; ++r) {
            // We need to check all of the columns to determine if they are empty
            let isEmpty = true;
            for (let c = 0; c < regionValues[r].length; ++c) {
                if (regionValues[r][c] !== "" && regionValues[r][c] !== null && regionValues[r][c] !== undefined) {
                    isEmpty = false;
                    break;
                }
            }

            // If we got this far and it's empty then we have an insertion point
            if (isEmpty) {
                return startRowIndex + r;
            }
        }

        // If we got this far, there isn't anything
        return endingRowIndex!;
    }

    /**
     * Find all places in the spreadsheet that contain the specified text
     * @param text The text that is to be searched for across all spreadsheets
     * @returns Returns the array of cells that contain the text
     */
    public findInSpreadSheet(text: string): GoogleAppsScript.Spreadsheet.Range[] {
        if (this._spreadsheet === null) {
            throw `NullReferenceException: The Spreadsheet property hasn't been assigned`;
        }
        return this._spreadsheet.createTextFinder(text)
            .matchEntireCell(true)
            .findAll();
    }
}
