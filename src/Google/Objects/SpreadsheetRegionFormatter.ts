namespace MC.GAS.Objects {
    /**
     * Helper class that can be used to define an array of properties that that will be used
     * to insert data into a Google Sheet region
     */
    export class SpreadsheetRegionFormatter<T> {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of properties that are to be inserted into the data
         */
        private _properties: string[];

        /**
         * Lookup dictionary that can be used to retrieve the index of the specified property
         */
        private _indexLookup: MC.GAS.Dictionary<number>;

        /**
         * Lookup dictionary that can be used to store the formatting that will be applied to the insert cells
         */
        private _formatting: MC.GAS.Dictionary<string>;

        /**
         * Lookup dictionary of the callback functions that can be used to format the data in the object for insertion
         */
        private _dataCallback: MC.GAS.Dictionary<DataCallback<T>>;

        /**
         * Lookup dictionary of the note taking functions that can be used to collate notes that are to be inserted
         */
        private _notesCallback: MC.GAS.Dictionary<NotesCallback<T>>;

        /*----------Properties----------*/
        //PUBLIC

        /**
         * Retrieve the number of properties that are contained in the formatter
         * @returns Returns the number of properties that are registered in this formatter
         */
        public get propertyCount() {
            return this._properties.length;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Setup a formatter object that can be used to insert data into a region based on input JSON
         * @param properties The array of named properties, in the order they appear in a region row
         * @param formatting [Optional] A lookup collection of formatting options that will be applied to cells for display
         * @param data [Optional] A lookup of callback functions that can be used to format input data for display
         * @param notes [Optional] A lookup of callback functions that can be used to format input data for settings notes
         */
        public constructor(properties: string[],
                           formatting?: MC.GAS.Dictionary<string> | null | undefined,
                           data?: MC.GAS.Dictionary<DataCallback<T>> | null | undefined,
                           notes?: MC.GAS.Dictionary<NotesCallback<T>> | null | undefined) {
            // Stash the elements that are needed
            this._properties = properties;
            this._formatting = formatting;
            this._dataCallback = data;
            this._notesCallback = notes;

            // Create the index lookup collection that is needed
            this._indexLookup = new MC.GAS.Dictionary<number>();
            for (let i = 0; i < this._properties.length; ++i) {
                if (!this._properties[i]) {
                    continue;
                }
                this._indexLookup.replace(
                    this._properties[i],
                    i
                );
            }
        }

        /**
         * Find the index of the specified property in the internal collection
         * @param property The property name that is to be looked up
         * @param fatal Flags if a failure to find the specified property should be considered fatal
         * @returns Returns the index of the property within formatter, or -1 if it doesn't exist
         */
        public getIndex(property: string, fatal: boolean = true): number {
            // If we have the value, no problem
            if (this._indexLookup.hasKey(property)) {
                return this._indexLookup.get(property);
            } else if (!fatal) {
                return -1;
            }

            // We want a descriptive exception so that we can track the problem
            throw `MissingPropertyException: Was unable to find the property '${property}' in the format region of [${this._properties.join(" | ")}]`;
        }

        /**
         * Insert the supplied data into a region on a sheet as dictated by the contained properties
         * @param region The region in the Spreadsheet where the data should be inserted
         * @param data The collection of data that is to be processed and inserted into the region
         */
        public insertSingle(region: GoogleAppsScript.Spreadsheet.Range, data: InsertData<T>): void {
            this.insertCollection(region, [ data ]);
        }

        /**
         * Insert the supplied collection of data into a region on a sheet as dictated by the contained properties
         * @param region The region in the Spreadsheet where the data should be inserted
         * @param dataCollection The collection of data that is to be processed and inserted into the region
         */
        public insertCollection(region: GoogleAppsScript.Spreadsheet.Range, dataCollection: InsertData<T>[]): void {
            // We can batch the application if there are no formulas in the region
            let canBatch = true;
            let formulas = region.getFormulas();
            for (let r = 0; r < formulas.length && canBatch; ++r) {
                for (let c = 0; c < formulas[r].length; ++c) {
                    if (!this.isValueEmpty(formulas[r][c])) {
                        canBatch = false;
                        break;
                    }
                }
            }

            // We want to insert the data based on how it can be handled
            if (canBatch) {
                this.insertCollectionBatched(region, dataCollection);
            } else {
                this.insertCollectionInstanced(region, dataCollection);
            }
        }

        /**
         * Insert the supplied collection of data into a data buffer as dictated by the contained properties
         * @param buffer The buffer of data where the updated data should be inserted
         * @param data The collection of data that is to be processed and inserted into the region
         * @returns Returns true if the data in the buffer was updated with a new value
         */
        public insertDataBuffer(buffer: any[], data: InsertData<T>): boolean {
            // We need to iterate through the properties that are available for being set
            let updatedValue = false;
            let maxColumns = Math.min(this._properties.length, buffer.length);
            for (let c = 0; c < maxColumns; ++c) {
                // If there isn't a property at this entry, we can ignore it
                if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                    continue;
                }

                // Check if there is a property in the input data that matches the expected property name
                if (!data.hasOwnProperty(this._properties[c])) {
                    continue;
                }

                // Check to see if the value that is to be stored has been modified
                let newValue = (this._dataCallback && this._dataCallback.hasKey(this._properties[c]) ?
                    this._dataCallback.get(this._properties[c])(data[this._properties[c]], data) :
                    data[this._properties[c]]
                );

                // If the value is undefined, then we want to leave the cell as is
                if (newValue === undefined ||
                    newValue === buffer[c]) {
                    continue;
                }

                // We can update the buffer with the new value
                updatedValue = true;
                buffer[c] = newValue;
            }
            return updatedValue;
        }

        /**
         * Insert the supplied collection of data into a data buffer as dictated by the contained properties
         * @param buffer The buffer of data where the updated data should be inserted
         * @param rowOffset An offset into the initial dimension of the buffer to write to
         * @param columnOffset An offset into the second dimension of the buffer to write to
         * @param data The collection of data that is to be processed and inserted into the region
         * @returns Returns true if the data in the buffer was updated with a new value
         */
        public insertOffsetDataBuffer(buffer: any[][], rowOffset: number, columnOffset: number, data: InsertData<T>): boolean {
            // Check that the buffer has space for the specified values
            if (rowOffset >= buffer.length) {
                throw `IndexOutOfRangeException: Unable to write data to row ${rowOffset}, bounds of buffer is ${buffer.length}`;
            }

            // Iterate through the properties that are available to be set
            let updatedValue = false;
            let checkProperties = Math.min(this._properties.length, buffer[rowOffset].length - columnOffset);
            for (let c = 0; c < checkProperties; ++c) {
                // If there isn't a property at this entry, we can ignore it
                if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                    continue;
                }

                // Check if there is a property in the input data that matches the expected property name
                if (!data.hasOwnProperty(this._properties[c])) {
                    continue;
                }

                // Check to see if the value that is to be stored has been modified
                let newValue = (this._dataCallback && this._dataCallback.hasKey(this._properties[c]) ?
                    this._dataCallback.get(this._properties[c])(data[this._properties[c]], data) :
                    data[this._properties[c]]
                );

                // If the value is undefined, then we want to leave the cell as is
                if (newValue === undefined ||
                    newValue === buffer[rowOffset][columnOffset + c]) {
                    continue;
                }

                // We can update the buffer with the new value
                updatedValue = true;
                buffer[rowOffset][columnOffset + c] = newValue;
            }
            return updatedValue;
        }

        /**
         * Append the supplied data to the specified sheet in the order of defined properties
         * @param sheet The sheet where the data is to be appended to
         * @param data The data source where information is to be extracted for insertion
         */
        public appendToSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: InsertData<T>): void {
            // We are going to need to build an array of values based on those that are in the data
            let rowEntry: any[] = [];

            // Iterate through the properties to know how to store them
            for (let i = 0; i < this._properties.length; ++i) {
                // If there isn't a property at this entry, we can ignore it
                // Or if the property doesn't exist on the data object, we can use a blank
                if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[i]) ||
                    !data.hasOwnProperty(this._properties[i])) {
                    rowEntry.push("");
                    continue;
                }

                // Otherwise, we just add the value from the data object
                rowEntry.push(data[this._properties[i]]);
            }

            // We can append this to the bottom of the sheet
            sheet.appendRow(rowEntry);
        }

        /**
         * Read a data object from a region on a sheet
         * @param region The region of the sheet that the data is meant to be read in from
         * @returns Returns the reconstructed data object from the region in the sheet
         */
        public readDataRegion(region: GoogleAppsScript.Spreadsheet.Range): InsertData<T> {
            return this.readCollectionRegion(region)[0];
        }

        /**
         * Read a collection of data objects from a region on a sheet
         * @param region The region of the sheet that the data is meant to be read in from
         * @param stopOnEmpty [Optional] Flags if the retrieving of values should be halted when an empty row is found
         * @returns Returns an array of the reconstructed data objects from the region in the sheet
         */
        public readCollectionRegion(region: GoogleAppsScript.Spreadsheet.Range, stopOnEmpty: boolean = true): InsertData<T>[] {
            // We need to compile a list of all the resulting data objects that can be used
            let results: InsertData<T>[] = [];

            // We need to search through all of the elements in the returned values
            let values = region.getValues();
            for (let r = 0; r < values.length; ++r) {
                // We need to process information for each row
                let isEmpty = true;
                for (let c = 0; c < values[r].length; ++c) {
                    if (!this.isValueEmpty(values[r][c])) {
                        isEmpty = false;
                        break;
                    }
                }

                // If this is an empty row, we can decide what to do with the data
                if (isEmpty) {
                    if (stopOnEmpty) {
                        break;
                    }
                    continue;
                }

                // Add the object to the list for use
                results.push(this.readDataBuffer(values[r]));
            }
            return results;
        }

        /**
         * Read the data of the object from a buffer based on the specified format
         * @param buffer The buffer of information that can be read from. This assumes the buffer has valid data in the correct locations!
         * @returns Returns the data object from the supplied data buffer
         */
        public readDataBuffer(buffer: any[]): InsertData<T> {
            // We can only read a certain amount of properties
            let data: MC.GAS.JObject = {};
            let checkProperties = Math.min(this._properties.length, buffer.length);
            for (let c = 0; c < checkProperties; ++c) {
                // Check to see if the property is valid
                if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                    continue;
                }

                // Read in the value that is available
                data[this._properties[c]] = buffer[c];
            }

            // Return the object data
            return data as InsertData<T>;
        }

        /**
         * Read the data of the object from a buffer based on the specified format
         * @param buffer The buffer of information that can be read from. This assumes the buffer has valid data in the correct locations!
         * @param rowOffset An offset into the initial dimension of the buffer to be read from
         * @param columnOffset An offset into the second dimension of the buffer to be read from
         * @returns Returns the data object from the supplied data buffer
         */
        public readOffsetDataBuffer(buffer: any[][], rowOffset: number, columnOffset: number): InsertData<T> {
            // Check that the buffer has space for the specified values
            if (rowOffset >= buffer.length) {
                throw `IndexOutOfRangeException: Unable to read data from row ${rowOffset}, bounds of buffer is ${buffer.length}`;
            }

            // We can only read a certain amount of properties
            let data: MC.GAS.JObject = {};
            let checkProperties = Math.min(this._properties.length, buffer[rowOffset].length - columnOffset);
            for (let c = 0; c < checkProperties; ++c) {
                // Check to see if the property is valid
                if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                    continue;
                }

                // Read in the value that is available
                data[this._properties[c]] = buffer[rowOffset][columnOffset + c];
            }

            // Return the object data
            return data as InsertData<T>;
        }

        //PRIVATE
        
        /**
         * Insert the supplied collection of data into a region on a sheet as dictated by the contained properties in a batched application process
         * @param region The region in the Spreadsheet where the data should be inserted
         * @param dataCollection The collection of data that is to be processed and inserted into the region
         */
        private insertCollectionBatched(region: GoogleAppsScript.Spreadsheet.Range, dataCollection: InsertData<T>[]): void {
            // Retrieve the collections of data that are going to be modified by this process
            let values = region.getValues();
            let formatting = region.getNumberFormats();
            let notes = region.getNotes();

            // We need to iterate through every row that is defined in the region and see if we need to modify anything
            let modifiedMask: InsertDataTypeMask = InsertDataTypeMask.None;
            let maxRows = Math.min(values.length, dataCollection.length);
            for (let r = 0; r < maxRows; ++r) {
                // We need to iterate through the properties that are available for being set
                let maxColumns = Math.min(this._properties.length, values[r].length);
                for (let c = 0; c < maxColumns; ++c) {
                    // If there isn't a property at this entry, we can ignore it
                    if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                        continue;
                    }

                    // Check if there is a property in the input data that matches the expected property name
                    let data = dataCollection[r];
                    if (!data.hasOwnProperty(this._properties[c])) {
                        continue;
                    }

                    // Check to see if the value that is to be stored has been modified
                    let newValue = (this._dataCallback && this._dataCallback.hasKey(this._properties[c]) ?
                        this._dataCallback.get(this._properties[c])(data[this._properties[c]], data) :
                        data[this._properties[c]]
                    );

                    // If the value is undefined, then we want to leave the cell as is
                    if (newValue === undefined) {
                        continue;
                    }

                    // Check to see if the value in the cell needs to be updated
                    if (newValue !== values[r][c]) {
                        values[r][c] = newValue;
                        modifiedMask |= InsertDataTypeMask.Value;
                    }

                    // Check to see if the display formatting has been changed
                    if (this._formatting) {
                        let newFormatting = (this._formatting.hasKey(this._properties[c]) ?
                            this._formatting.get(this._properties[c]) :
                            formatting[r][c]
                        );
                        if (newFormatting !== formatting[r][c]) {
                            formatting[r][c] = newFormatting;
                            modifiedMask |= InsertDataTypeMask.Formatting;
                        }
                    }

                    // Check to see if the notes have changed
                    if (this._notesCallback) {
                        let newNote = (this._notesCallback.hasKey(this._properties[c]) ?
                            this._notesCallback.get(this._properties[c])(data[this._properties[c]], data) :
                            ""
                        );
                        if (newNote !== notes[r][c]) {
                            notes[r][c] = newNote;
                            modifiedMask |= InsertDataTypeMask.Note;
                        }
                    }
                }
            }

            // Update the data in the region that has been changed
            if ((modifiedMask & InsertDataTypeMask.Value) !== 0) {
                region.setValues(values);
            }
            if ((modifiedMask & InsertDataTypeMask.Formatting) !== 0) {
                region.setNumberFormats(formatting);
            }
            if ((modifiedMask & InsertDataTypeMask.Note) !== 0) {
                region.setNotes(notes);
            }
        }

        /**
         * Insert the supplied collection of data into a region on a sheet as dictated by the contained properties as individual cells
         * @param region The region in the Spreadhseet where the data should be inserted
         * @param dataCollection The collection of data that is to be processed and inserted into the region
         */
        private insertCollectionInstanced(region: GoogleAppsScript.Spreadsheet.Range, dataCollection: InsertData<T>[]): void {
            // We need to know how many rows we can iterate through
            let maxRows = Math.min(region.getNumRows(), dataCollection.length);
            let maxColumns = Math.min(region.getNumColumns(), this._properties.length);
            for (let r = 0; r < maxRows; ++r) {
                for (let c = 0; c < maxColumns; ++c) {
                    // If there isn't a property at this entry, we can ignore it
                    if (MC.GAS.StringExtensions.isNullOrEmpty(this._properties[c])) {
                        continue;
                    }

                    // Check if there is a property in the input data that matches the expected property name
                    let data = dataCollection[r];
                    if (!data.hasOwnProperty(this._properties[c])) {
                        continue;
                    }

                    // Check to see if the value that is to be stored has been modified
                    let newValue = (this._dataCallback && this._dataCallback.hasKey(this._properties[c]) ?
                        this._dataCallback.get(this._properties[c])(data[this._properties[c]], data) :
                        data[this._properties[c]]
                    );

                    // If the value is undefined, then we want to leave the cell as is
                    if (newValue === undefined) {
                        continue;
                    }

                    // Check to see if the cell needs to update the values
                    let cell = region.getCell(r + 1, c + 1);
                    if (newValue !== cell.getValue()) {
                        cell.setValue(newValue);
                    }

                    // Check to see if the display formatting has been changed
                    if (this._formatting) {
                        let existingFormat = cell.getNumberFormat();
                        let newFormatting = (this._formatting.hasKey(this._properties[c]) ?
                            this._formatting.get(this._properties[c]) :
                            existingFormat
                        );
                        if (newFormatting !== existingFormat) {
                            cell.setNumberFormat(newFormatting);
                        }
                    }

                    // Check to see if the notes have changed
                    if (this._notesCallback) {
                        let newNote = (this._notesCallback.hasKey(this._properties[c]) ?
                            this._notesCallback.get(this._properties[c])(data[this._properties[c]], data) :
                            ""
                        );
                        if (newNote !== cell.getNote()) {
                            cell.setNote(newNote);
                        }
                    }
                }
            }
        }

        /**
         * Check to see if a cell value on a sheet should be considered empty
         * @param value The value that is to be checked for processing
         * @returns Returns true if the value is empty
         */
        private isValueEmpty(value: any): boolean {
            return value === "" || value === null || value === undefined;
        }
    }

    /**
     * Defines a callback type that can be used to format data in the region formatter when processing responses
     */
    export type DataCallback<T> = (value: any, data: T) => any;

    /**
     * Defines a callback type that can be used to format data in the region formatter when processing notes to apply to a region
     */
    export type NotesCallback<T> = (value: any, data: T) => string;

    /**
     * Type alias for the type of data that can be inserted into the region formatter
     */
    export type InsertData<T> = T & { [key: string]: any };

    /**
     * A mask of the different types of properties that can be modified during an insertion operation
     */
    enum InsertDataTypeMask {
        None        = 0,
        Value       = 1 << 0,
        Formatting  = 1 << 1,
        Note        = 1 << 2,
    }
}
