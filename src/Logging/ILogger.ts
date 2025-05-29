namespace MC.GAS.Logging {
    /**
     * Interface that is used to define an object that can be used to output log data for processing
     */
    export interface ILogger {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Log basic information to the output
         * @param message The message that is to be logged
         */
        log(message: any): void;

        /**
         * Log a warning to the output
         * @param message The message that is to be logged
         */
        warning(message: any): void;

        /**
         * Log an error to the output
         * @param message The message that is to be logged
         */
        error(message: any): void;

        /**
         * Log an exception to the output
         * @param message The message that is to be logged
         * @param exception The exception that occurred
         */
        exception(message: any, exception: any): void;
    }
}
