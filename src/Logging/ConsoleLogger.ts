namespace MC.GAS.Logging {
    /**
     * Provide a basic wrapper around the standard Javascript logger
     */
    export class ConsoleLogging implements ILogger {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Log basic information to the output
         * @param message The message that is to be logged
         */
        log(message: any): void {
            console.log(message);
        }

        /**
         * Log a warning to the output
         * @param message The message that is to be logged
         */
        warning(message: any): void {
            console.warn(message);
        }

        /**
         * Log an error to the output
         * @param message The message that is to be logged
         */
        error(message: any): void {
            console.error(message);
        }

        /**
         * Log an exception to the output
         * @param message The message that is to be logged
         * @param exception The exception that occurred
         */
        exception(message: any, exception: any): void {
            console.error(`[EXP] ${message}\n${exception}`);
        }
    }
}
