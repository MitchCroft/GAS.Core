namespace MC.GAS.API {
    /**
     * Basic container object that can be used to retrieve error information in a standard format that can be used
     */
    export class ErrorResponse {
        /*----------Variables----------*/
        //PUBLIC

        /**
         * Additional information about what went wrong when trying to process the response
         */
        public readonly error: string;

        /**
         * The response code that was received from the process
         */
        public readonly responseCode: number | null | undefined;

        /*----------Functions----------*/
        //PUBLIC
        
        /**
         * Populate the response object with the required information
         * @param error Additional information about the error that occurred
         * @param responseCode The response code that resulted from the request
         */
        public constructor(error: string, responseCode?: number | null | undefined) {
            this.error = error;
            this.responseCode = responseCode;
        }

        /**
         * Generate a custom string representation of the error that occurred
         * @returns Returns a string representation of the error element
         */
        public toString(): string {
            return `[${this.responseCode}] ${this.error}`;
        }

        /**
         * Check to see if the supplied object is an APIErrorResponse object
         * @param obj The object that is being tested against to determine if it's an error response
         * @returns Returns a flag that indicates if the supplied object is an APIErrorResponse object
         */
        public static isErrorResponse(obj: MC.GAS.JObject): obj is ErrorResponse {
            return typeof obj.responseCode === "number" &&
                typeof obj.error === "string";
        }
    }
}