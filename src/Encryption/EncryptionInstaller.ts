namespace MC.GAS.Encryption {
    /**
     * Handle the registration of the encryption elements that are needed for operation
     */
    export class EncryptionInstaller implements MC.GAS.DI.IInstaller {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Install required elements from the specified object for use in operation
         * @param builder The builder that can be used to assign elements that are needed for operation
         */
        public install(builder: MC.GAS.DI.IDependencyBuilder): void {
            builder.registerInstance("IEncryptionProvider", new BasicEncryptionProvider());
        }
    }
}
