namespace MC.GAS.Logging {
    /**
     * Handle logging of elements to the Google App Script Logger object
     */
    export class GASLogger implements ILogger {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Log basic information to the output
         * @param message The message that is to be logged
         */
        public log(message: any): void {
            Logger.log(`[LOG] ${message}`);
        }

        /**
         * Log a warning to the output
         * @param message The message that is to be logged
         */
        public warning(message: any): void {
            Logger.log(`[WARN] ${message}`);
        }

        /**
         * Log an error to the output
         * @param message The message that is to be logged
         */
        public error(message: any): void {
            Logger.log(`[ERR] ${message}`);
        }

        /**
         * Log an exception to the output
         * @param message The message that is to be logged
         * @param exception The exception that occurred
         */
        public exception(message: any, exception: any): void {
            Logger.log(`[EXP] ${message}\n${exception}`);
        }
    }
}
