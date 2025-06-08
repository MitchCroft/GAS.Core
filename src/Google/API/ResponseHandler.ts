namespace MC.GAS.API {
    /**
     * Template class that will be used to determine how the API request will be handled when sending elements
     */    
    export class ResponseHandler<T> {
        /*----------Variables----------*/
        //PUBLIC

        /**
         * The schema that will be matched against to raise use this handler
         */
        public readonly schema: MC.GAS.Schema.Schema;

        /**
         * Callback function that will be used to handle the parsing of the received data into the specified format
         */
        public readonly formatData: HandlerCallback<T>;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create the object with the elements that will be used to proecss the response
         * @param schema The schema object that will be matched against to result in this callback being used
         * @param callback The callback that will be used to format the received data into the required format
         */
        public constructor(schema: MC.GAS.Schema.Schema, callback: HandlerCallback<T>) {
            this.schema = schema;
            this.formatData = callback;
        }
    }
}