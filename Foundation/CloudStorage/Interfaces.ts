import { Mapping } from "../Objects";
import { Directory, File } from "./Objects";

/**
 * Basic outline of the class that will be used to process interactions with a cloud storage platform
 */
export interface ICloudStorage {
    /*----------Properties----------*/
    //PUBLIC


    /*----------Functions----------*/
    //PUBLIC

    /**
     * Ensure that a specific directory exists within the cloud storage platform
     * @param path The path that is to be ensured exists, delineated with '/' characters. E.g. Parent/Child/Final/
     * @param parent [Optional] The parent directory that the specified path should be relative to
     * @returns Returns the directory description object for the specified directory
     */
    createDirectory(path: string, parent: Directory | null): Directory;

    /**
     * Create a file within the cloud provider with the specified information
     * @param data The data that is to be included in the file that is created
     * @param mimeType The MIME type that is to be assigned to the created file
     * @param name The name that is to be assigned to the file for processing
     * @param extension The extension that is to be assigned to the file for processing
     * @param directory [Optional] The parent directory where the file should be created. If null, will use the root drive folder
     * @returns Returns a file description object for the created file
     */
    createFile(data: number[], mimeType: string, name: string, extension: string, directory: Directory | null): File;

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
