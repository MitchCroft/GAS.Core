import { Mapping } from "../Objects";
import { Directory, File } from "./Objects";

/**
 * Basic outline of the class that will be used to process interactions with a cloud storage platform
 */
export interface ICloudStorage {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Retrieve the directory object with the specified ID
     * @param id The ID of the directory that is to be retrieved
     * @returns Returns the Directory object that corresponds to the ID
     */
    getDirectory(id: string): Directory;

    /**
     * Try to find a directory with a specific name
     * @param name The name of the directory that is to be searched
     * @param directory [Optional] A directory that the search will be constrained to
     * @returns Returns the directory that was found or null if unable to find
     */
    tryGetDirectoryWithName(name: string, directory?: Directory): Directory | null;

    /**
     * Retrieve the file object with the specified ID
     * @param id The ID of the file that is to be retrieved
     * @returns Returns the File object that corresponds to the ID
     */
    getFile(id: string): File;

    /**
     * Try to find a file with a specific name
     * @param name The name of the file that is to be searched for
     * @param directory [Optional] A directory that the search will be constrained to
     * @returns Returns the file that was found or null if unable to find
     */
    tryGetFileWithName(name: string, directory?: Directory): File | null;

    /**
     * Ensure that a specific directory exists within the cloud storage platform
     * @param path The path that is to be ensured exists, delineated with '/' characters. E.g. Parent/Child/Final/
     * @param parent [Optional] The parent directory that the specified path should be relative to
     * @returns Returns the directory description object for the specified directory
     */
    createDirectory(path: string, parent?: Directory): Directory;

    /**
     * Create a file within the cloud provider with the specified information
     * @param data The data that is to be included in the file that is created
     * @param mimeType The MIME type that is to be assigned to the created file
     * @param name The name that is to be assigned to the file for processing
     * @param extension The extension that is to be assigned to the file for processing
     * @param directory [Optional] The parent directory where the file should be created. If null, will use the root drive folder
     * @returns Returns a file description object for the created file
     */
    createFile(data: number[], mimeType: string, name: string, extension: string, directory?: Directory): File;

    /**
     * Assign meta data to a file within the cloud provider
     * @param file The file that the meta data should be attached to
     * @param metadata The collection of meta data entries that should be assigned to the file
     */
    setFileMetadata(file: File, metadata: Mapping<string>): void;

    /**
     * Retrieve a link to the specified file for processing
     * @param file The file that is to have the share link retrieved for use
     * @returns Returns the URL for external resource access
     */
    getFileShareLink(file: File): string;
}
