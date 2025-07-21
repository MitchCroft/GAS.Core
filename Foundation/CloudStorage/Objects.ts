/**
 * Base type for a resource that exists in a cloud storage platform
 */
export type Resource = {
    /**
     * The unique identifier that is associated with the resource in the cloud platform
     */
    id: string,

    /**
     * The name that has been assigned to the resource in the cloud platform
     */
    name: string
};

/**
 * Represents a directory object within a cloud storage provider
 */
export type Directory = Resource & {
    /**
     * [Optional] The parent directory where this directory exists
     */
    parent: Directory | null
};

/**
 * A representation of a file that can be uploaded
 */
export type File = Resource & {
    /**
     * The extension that should be assigned to the file
     */
    extension: string,

    /**
     * The MIME type that is assigned to the file for processing
     */
    mimeType: string,

    /**
     * The directory that this file exists within
     */
    parent: Directory | null
};
