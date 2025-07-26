import { ICloudStorage } from "../Foundation/CloudStorage/Interfaces";
import { Directory, File } from "../Foundation/CloudStorage/Objects";
import { StringExtensions } from "../Foundation/Extensions";
import { Mapping } from "../Foundation/Objects";

/**
 * Implementation to allow for interaction with Google Drive for processing file data
 */
export class GoogleCloudStorage implements ICloudStorage {

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Retrieve the directory object with the specified ID
     * @param id The ID of the directory that is to be retrieved
     * @returns Returns the Directory object that corresponds to the ID
     */
    public getDirectory(id: string): Directory {
        return this.createDirectoryObject(DriveApp.getFolderById(id));
    }

    /**
     * Try to find a directory with a specific name
     * @param name The name of the directory that is to be searched
     * @param directory [Optional] A directory that the search will be constrained to
     * @returns Returns the directory that was found or null if unable to find
     */
    public tryGetDirectoryWithName(name: string, directory?: Directory): Directory | null {
        // Find all directories with the name
        let iterator = DriveApp.getFoldersByName(name);
        while (iterator.hasNext()) {
            // Check to make sure the name is a direct match
            let currentFolder = iterator.next();
            if (currentFolder.getName() !== name) {
                continue;
            }

            // If we're not limiting the search, first will do
            let currentDirectory = this.createDirectoryObject(currentFolder);
            if (directory === undefined) {
                return currentDirectory;
            }

            // Check to see if this directory is within the specified search location
            let testDirectory = currentDirectory.parent;
            while (testDirectory !== null) {
                if (testDirectory.id === directory.id) {
                    return currentDirectory;
                }
                testDirectory = testDirectory.parent;
            }
        }
        return null;
    }

    /**
     * Retrieve the file object with the specified ID
     * @param id The ID of the file that is to be retrieved
     * @returns Returns the File object that corresponds to the ID
     */
    public getFile(id: string): File {
        return this.createFileObject(DriveApp.getFileById(id));
    }

    /**
     * Try to find a file with a specific name
     * @param name The name of the file that is to be searched for
     * @param directory [Optional] A directory that the search will be constrained to
     * @returns Returns the file that was found or null if unable to find
     * @comment The file extension is expected to be a part of the name being searched for
     */
    public tryGetFileWithName(name: string, directory?: Directory): File | null {
        // Find all files with the name
        let iterator = DriveApp.getFilesByName(name);
        while (iterator.hasNext()) {
            // Check to make sure the name is a direct match
            let currentFile = iterator.next();
            if (currentFile.getName() !== name) {
                continue;
            }

            // If we're not limiting the search, first will do
            let fileObj = this.createFileObject(currentFile);
            if (directory === undefined) {
                return fileObj;
            }

            // Check to see if this directory is within the specified search location
            let testDirectory = fileObj.parent;
            while (testDirectory !== null) {
                if (testDirectory.id === directory.id) {
                    return fileObj;
                }
                testDirectory = testDirectory.parent;
            }
        }
        return null;
    }

    /**
     * Ensure that a specific directory exists within the cloud storage platform
     * @param path The path that is to be ensured exists, delineated with '/' characters. E.g. Parent/Child/Final/
     * @param parent [Optional] The parent directory that the specified path should be relative to. If null, will use the root drive folder
     * @returns Returns the directory description object for the specified directory
     */
    public createDirectory(path: string, parent?: Directory): Directory {
        // We need the main directory that operations will be based on
        let currentFolder = parent ? DriveApp.getFolderById(parent.id) : DriveApp.getRootFolder();

        // Divide the path into the different segments that are needed for processing
        let segments = path.replace('\\', '/').split('/');

        // Iterate through the path and make sure that the segment elements exist
        for (let i = 0; i < segments.length; ++i) {
            // Skip empty sections in the path
            let seg = segments[i].trim();
            if (StringExtensions.isNullOrEmpty(seg)) {
                continue;
            }

            // Make sure that the directory exists
            let nextFolders = currentFolder.getFoldersByName(seg);
            currentFolder = nextFolders.hasNext() ? nextFolders.next() : currentFolder.createFolder(seg);
        }
        return this.createDirectoryObject(currentFolder);
    }

    /**
     * Create a file within the cloud provider with the specified information
     * @param data The data that is to be included in the file that is created
     * @param mimeType The MIME type that is to be assigned to the created file
     * @param name The name that is to be assigned to the file for processing
     * @param extension The extension that is to be assigned to the file for processing
     * @param directory [Optional] The parent directory where the file should be created. If null, will use the root drive folder
     * @returns Returns a file description object for the created file
     */
    public createFile(data: number[], mimeType: string, name: string, extension: string, directory?: Directory): File
    {
        // We need the main directory that operations will be based on
        let currentFolder = directory ? DriveApp.getFolderById(directory.id) : DriveApp.getRootFolder();

        // Create the blob for the data that is going to be processed
        let dataBlob = Utilities.newBlob(data, mimeType, `${name.trim()}.${extension.trim()}`);

        // Create the file element in the drive
        let newFile = currentFolder.createFile(dataBlob);
        return this.createFileObject(newFile);
    }

    /**
     * Assign meta data to a file within the cloud provider
     * @param file The file that the meta data should be attached to
     * @param metadata The collection of meta data entries that should be assigned to the file
     */
    public setFileMetadata(file: File, metadata: Mapping<string>): void {
        let resourceFile = DriveApp.getFileById(file.id);
        resourceFile.setDescription(JSON.stringify(metadata));
    }

    /**
     * Retrieve a link to the specified file for processing
     * @param file The file that is to have the share link retrieved for use
     * @returns Returns the URL for external resource access
     */
    public getFileShareLink(file: File): string {
        let resourceFile = DriveApp.getFileById(file.id);
        resourceFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return resourceFile.getUrl();
    }
    
    /**
     * Retrieve the binary file data for the specified entry
     * @param file The file object that is to have the required data retrieved
     * @returns Returns the binary data from the file that was found
     */
    public getFileData(file: File): number[] {
        let resourceFile = DriveApp.getFileById(file.id);
        return resourceFile.getBlob().getBytes() as number[];
    }

    //PRIVATE

    /**
     * Handle the processing of a Google Drive folder into a common object return
     * @param folder The folder that is to be converted for processing
     * @returns Returns a directory object description based on the supplied google drive folder
     */
    private createDirectoryObject(folder: GoogleAppsScript.Drive.Folder): Directory {
        let parent = folder.getParents();
        return {
            id: folder.getId(),
            name: folder.getName(),
            parent: parent.hasNext() ? this.createDirectoryObject(parent.next()) : null
        };     
    }

    /**
     * Handle the processing of a Google Drive File into a common object return
     * @param file The file that is to be converted for processing
     * @returns Returns a file object description based on the supplied google drive file
     */
    private createFileObject(file: GoogleAppsScript.Drive.File): File {
        let parent = file.getParents();

        let fullname = file.getName();
        let lastDot = fullname.lastIndexOf(".");
        let name = lastDot >= 0 ? fullname.substring(0, lastDot) : fullname;
        let extension = lastDot >= 0 ? fullname.substring(lastDot + 1) : "";

        return {
            id: file.getId(),
            name: name,
            extension: extension,
            mimeType: file.getMimeType(),
            parent: parent.hasNext() ? this.createDirectoryObject(parent.next()) : null
        };
    }
}
