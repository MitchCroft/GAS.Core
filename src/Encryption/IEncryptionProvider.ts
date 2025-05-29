namespace MC.GAS.Encryption {
    /**
     * An interface for providers that can provide encryption/decryption functionality for processing
     */
    export interface IEncryptionProvider {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Encrypt the supplied plaintext via the specified password
         * @param plainText The plain text string that is to be encoded
         * @param password The password that should be used for processing the encryption process
         * @returns Returns the resulting encrypted content as a base64 encoded string
         */
        encrypt(plainText: string, password: string): string;

        /**
         * Decrypt the supplied text via with the specified password
         * @param encoded The encoded string that is to be processed
         * @param password The password that will be used to decode the encryption process
         * @returns Returns the resulting string from the decoded data
         */
        decrypt(encoded: string, password: string): string;
    }
}
