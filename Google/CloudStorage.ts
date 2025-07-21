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
     * Ensure that a specific directory exists within the cloud storage platform
     * @param path The path that is to be ensured exists, delineated with '/' characters. E.g. Parent/Child/Final/
     * @param parent [Optional] The parent directory that the specified path should be relative to. If null, will use the root drive folder
     * @returns Returns the directory description object for the specified directory
     */
    public createDirectory(path: string, parent: Directory | null = null): Directory {
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
    public createFile(data: number[], mimeType: string, name: string, extension: string, directory: Directory | null = null): File
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
        Drive.Files.update({ properties: metadata }, file.id);
    }

    /**
     * Retrieve a link to the specified file for processing
     * @param file The file that is to have the share link retrieved for use
     * @returns Returns the URL for external resource access
     */
    public getFileShareLink(file: File): string {
        let metaData = Drive.Files.get(file.id, { fields: 'webViewLink' });
        return metaData.webViewLink ?? "";
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
