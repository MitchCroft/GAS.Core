namespace MC.GAS.Handlers {
    /**
     * Basic interface for locking write access to the sheet to prevent race condition operations
     */
    export class WriteAccessHandler {
        /*----------Variables----------*/
        //CONST

        /**
         * The length of time that the process can wait for before trying to process the request
         */
        private readonly LOCK_OUT_PERIOD = 60000; // 60s

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Attempt to lock write access to the application and then run the callback action
         * @param callback The callback function that is to be raised when access is available
         */
        public runAction(callback: (() => void)): void {
            // We need to get the lock to prevent duplicate modifications
            let lock = LockService.getScriptLock();
            try {
                lock.waitLock(this.LOCK_OUT_PERIOD);
                callback();
            }

            // Once everything is handled, we need to release the lock
            finally {
                SpreadsheetApp.flush();
                lock.releaseLock();
            }
        }
    }
}
