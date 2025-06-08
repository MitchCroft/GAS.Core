namespace MC.GAS.Encryption {
    /**
     * Handle basic encryption processes for string values that are provided
     */
    export class BasicEncryptionProvider implements IEncryptionProvider, MC.GAS.DI.IInjectionTarget {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The encoding provider that will be used to process the text enxcryption process
         */
        private _encodingProvider: MC.GAS.Encoding.IEncodingProvider;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Retrieve the object references that are required to process data
         * @param resolver The resolver that can be used to retrieve the required object references
         */
        public construct(resolver: DI.IDependencyResolver): void {
            this._encodingProvider = resolver.resolve("IEncodingProvider") as MC.GAS.Encoding.IEncodingProvider;
        }

        /**
         * Encrypt the supplied plaintext via the specified password
         * @param plainText The plain text string that is to be encoded
         * @param password The password that should be used for processing the encryption process
         * @returns Returns the resulting encrypted content as a base64 encoded string
         */
        public encrypt(plainText: string, password: string): string {
            // Convert plaintext to bytes
            const plaintextBytes = new Uint8Array(this.stringToBytes(plainText));

            // Derive a seed from the password
            const seed = this.hashPassword(password);

            // Generate a keystream as long as the plaintext
            const keystream = this.generateKeystream(seed, plaintextBytes.length);

            // XOR the plaintext with the keystream
            const cipherBytes = this.xorCrypt(plaintextBytes, keystream);
            return this._encodingProvider.toBase64(cipherBytes);
        }

        /**
         * Decrypt the supplied text via with the specified password
         * @param encoded The encoded string that is to be processed
         * @param password The password that will be used to decode the encryption process
         * @returns Returns the resulting string from the decoded data
         */
        public decrypt(encoded: string, password: string): string {
            // Convert the base64 ciphertext back to bytes
            const cipherBytes = this._encodingProvider.fromBase64(encoded);

            // Derive the same seed from the password
            const seed = this.hashPassword(password);

            // Generate the identical keystream
            const keystream = this.generateKeystream(seed, cipherBytes.length);

            // XOR the ciphertext with the keystream to recover the plaintext
            const plaintextBytes = this.xorCrypt(cipherBytes, keystream);
            return this.bytesToString(Array.from(plaintextBytes));
        }

        //PRIVATE

        /**
         * Convert a supplied string into an array of byte data
         * @param str The string that is to be converted into bytes for processing
         * @returns Returns an array of the byte data that makes up the string
         */
        private stringToBytes(str: string): number[] {
            const bytes: number[] = [];
            for (let i = 0; i < str.length; ++i) {
                let codePoint = str.codePointAt(i);

                // If the code point uses two UTF-16 code units, increment i.
                if (codePoint > 0xffff) {
                    i++;
                }

                if (codePoint < 0x80) {
                    // 1-byte sequence (ASCII)
                    bytes.push(codePoint);
                } else if (codePoint < 0x800) {
                    // 2-byte sequence
                    bytes.push(0xc0 | (codePoint >> 6));
                    bytes.push(0x80 | (codePoint & 0x3f));
                } else if (codePoint < 0x10000) {
                    // 3-byte sequence
                    bytes.push(0xe0 | (codePoint >> 12));
                    bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                    bytes.push(0x80 | (codePoint & 0x3f));
                } else {
                    // 4-byte sequence
                    bytes.push(0xf0 | (codePoint >> 18));
                    bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
                    bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                    bytes.push(0x80 | (codePoint & 0x3f));
                }
            }
            return bytes;
        }

        /**
         * Convert a supplied buffer of bytes into a string
         * @param bytes The collection of bytes that is to be reconstructed into a string
         * @returns Returns a string made up from the supplied data
         */
        private bytesToString(bytes: number[]): string {
            let str = '';
            for (let i = 0; i < bytes.length;) {
                const byte1 = bytes[i];
        
                let codePoint = null;
                let bytesConsumed = 0;
        
                if (byte1 < 0x80) {
                    // 1-byte sequence (ASCII)
                    codePoint = byte1;
                    bytesConsumed = 1;
                } else if (byte1 >= 0xc0 && byte1 < 0xe0) {
                    // 2-byte sequence
                    if (i + 1 >= bytes.length) throw new Error('Invalid byte sequence');
                    const byte2 = bytes[i + 1];
                    codePoint = ((byte1 & 0x1F) << 6) | (byte2 & 0x3F);
                    bytesConsumed = 2;
                } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
                    // 3-byte sequence
                    if (i + 2 >= bytes.length) throw new Error('Invalid byte sequence');
                    const byte2 = bytes[i + 1];
                    const byte3 = bytes[i + 2];
                    codePoint = ((byte1 & 0x0F) << 12) |
                                            ((byte2 & 0x3F) << 6)  |
                                             (byte3 & 0x3F);
                    bytesConsumed = 3;
                } else if (byte1 >= 0xf0 && byte1 < 0xf8) {
                    // 4-byte sequence
                    if (i + 3 >= bytes.length) throw new Error('Invalid byte sequence');
                    const byte2 = bytes[i + 1];
                    const byte3 = bytes[i + 2];
                    const byte4 = bytes[i + 3];
                    codePoint = ((byte1 & 0x07) << 18) |
                                            ((byte2 & 0x3F) << 12) |
                                            ((byte3 & 0x3F) << 6)  |
                                             (byte4 & 0x3F);
                    bytesConsumed = 4;
                } else {
                    throw new Error('Invalid UTF-8 byte encountered');
                }
        
                // Convert the code point to a string:
                if (codePoint <= 0xFFFF) {
                    // BMP code point; directly convert.
                    str += String.fromCharCode(codePoint);
                } else {
                    // Code points beyond 0xFFFF require surrogate pairs.
                    codePoint -= 0x10000;
                    const highSurrogate = (codePoint >> 10) + 0xD800;
                    const lowSurrogate = (codePoint & 0x3FF) + 0xDC00;
                    str += String.fromCharCode(highSurrogate, lowSurrogate);
                }
        
                i += bytesConsumed;
            }
            return str;
        }

        /**
         * Get a hash of the input string password that can be used for the encryption process
         * @param password The plaintext password that is to be hashed
         * @returns Returns the hash value to represent the password
         * @remarks This uses a simple hash and linear congruation generator. It is not secure for protecting sensitive data
         */
        private hashPassword(password: string): number {
            let hash = 2166136261;
            for (let i = 0; i < password.length; i++) {
                hash ^= password.charCodeAt(i);
                hash = (hash * 16777619) >>> 0; // >>>0 to ensure a 32-bit unsigned result
            }
            return hash;
        }

        /**
         * Generates a psuedo-random array of bytes of specified length
         * @param seed The seed that will be used as the starting point of the generation process
         * @param length The number of bytes that are to be generated
         * @returns Returns a buffer of randomised data that can be used for the generation process
         */
        private generateKeystream(seed: number, length: number): Uint8Array {
            let keystream = new Uint8Array(length);
            let current = seed;
            for (let i = 0; i < length; i++) {
                // LCG parameters (using constants from Numerical Recipes)
                current = (1664525 * current + 1013904223) % 4294967296;
                // Use one byte (e.g. the high 8 bits) from the 32‑bit value
                keystream[i] = (current >>> 16) & 0xff;
            }
            return keystream;            
        }

        /**
         * Simple encryption using binary XORs of the plaintext byte data with the keystream
         * @param inputBytes The input collection of byte data that is to be processed
         * @param keystream The byte data that will be used to encrypt/decrypt the data
         * @returns Returns a byte array of the modified data
         */
        private xorCrypt(inputBytes: Uint8Array, keystream: Uint8Array): Uint8Array {
            const outputBytes: number[] = [];
            for (let i = 0; i < inputBytes.length; i++) {
                outputBytes.push(inputBytes[i] ^ keystream[i]);
            }
            return new Uint8Array(outputBytes);
        }
    }
}
