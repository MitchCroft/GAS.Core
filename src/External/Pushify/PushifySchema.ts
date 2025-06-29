namespace MC.GAS.External.Pushify {
    /**
     * Static utility class that can be used to create the schema that are required for processing requests
     */
    export class PushifySchema {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create the schema that represents a failed request to the backend
         * @returns Returns a schema description that can be used for all failed Pushify API requests
         */
        public static createFailureSchema(): MC.GAS.Schema.Schema {
            return new MC.GAS.Schema.SchemaBuilder()
                .addProperty("error")
                    .addValueValidation(new MC.GAS.Schema.BasicValueValidation(MC.GAS.Schema.BasicType.String))
                .build();
        }

        /**
         * Create the schema that represents a successful response from sending the data
         * @returns Returns a schema description for a valid return from "/send"
         */
        public static createSendSchema(): MC.GAS.Schema.Schema {
            return new Schema.SchemaBuilder()
                .addProperty("success")
                    .addValueValidation(new MC.GAS.Schema.BasicValueValidation(MC.GAS.Schema.BasicType.Boolean))
                .build();
        }
    }
}
