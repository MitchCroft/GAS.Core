namespace MC.GAS.Encoding {
    /**
     * Interface for an object that can be used to deal with the encoding of string data
     */
    export interface IEncodingProvider {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Encode an array of byte data into a transmissable string
         * @param byteArray The buffer of byte that is to be encoded
         * @returns Returns a base64 encoded string that can be processed
         */
        toBase64(byteArray: Uint8Array): string;

        /**
         * Convert a base64 encoded string back into a byte array for processing
         * @param base64 The base 64 encoded string that is to be decoded
         * @returns Returns a byte array of the data that can be further processed
         */
        fromBase64(base64: string): Uint8Array;
    }
}
