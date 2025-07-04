import { IEncodingProvider } from "../Foundation/Encoding";

/**
 * Use the built in Utility class in Google App Script to handle the conversion
 */
export class GASEncodingProvider implements IEncodingProvider {
    /*----------Functions----------*/
    //PUBLIC

    /**
     * Encode an array of byte data into a transmissable string
     * @param byteArray The buffer of byte that is to be encoded
     * @returns Returns a base64 encoded string that can be processed
     */
    public toBase64(byteArray: Uint8Array): string {
        return Utilities.base64Encode(Array.from(byteArray));
    }

    /**
     * Convert a base64 encoded string back into a byte array for processing
     * @param base64 The base 64 encoded string that is to be decoded
     * @returns Returns a byte array of the data that can be further processed
     */
    public fromBase64(base64: string): Uint8Array {
        return new Uint8Array(Utilities.base64Decode(base64));
    }
}
