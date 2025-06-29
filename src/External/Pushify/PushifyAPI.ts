namespace MC.GAS.External.Pushify {
    /**
     * Manage the API values that are needed to perform the remote interactions with the Pushify API
     */
    export class PushifyAPI extends MC.GAS.API.APIBase implements MC.GAS.DI.IInjectionTarget, MC.GAS.DI.IInitialisable {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of preference values that will be needed for processing the Pushify API requests
         */
        private readonly REQUIRED_PEREFERENCES: MC.GAS.Config.ConfigurationCollection = Object.freeze({
            apiRoot: new MC.GAS.Config.ConfigurationEntry("pushify_api_root"),
            apiToken: new MC.GAS.Config.ConfigurationEntry("pushify_api_token"),
            channelTarget: new MC.GAS.Config.ConfigurationEntry("pushify_channel_target")
        });

        /**
         * The configuration provider that will be used to retrieve the settings needed to operate
         */
        private _configurationProvider: MC.GAS.Config.IConfigurationProvider;

        /**
         * The collection of preference values that can be read and processed
         */
        private _preferances: MC.GAS.JObject;

        /**
         * We will need a set of schema that are used to process the various requests that are sent as a part of this API
         */
        private _failureHandler: MC.GAS.API.ResponseHandler<MC.GAS.API.ErrorResponse>;
        private _sendSchema: MC.GAS.Schema.Schema;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Initialise the values with the default elements
         */
        public constructor() {
            super();
            this._configurationProvider = null;
            this._preferances = null;
            this._failureHandler = null;
        }

        /**
         * Inject the required object references into this object for use
         * @param resolver Retrieve the object references that are required for processing requests
         */
        public construct(resolver: MC.GAS.DI.IDependencyResolver): void {
            this._configurationProvider = resolver.resolve("IConfigurationProvider") as MC.GAS.Config.IConfigurationProvider;
        }

        /**
         * Setup the collection of values that will be used to process requests
         */
        public init(): void {
            // Get the configuration values that are needed for processing
            this._preferances = this._configurationProvider.getConfigValues(this.REQUIRED_PEREFERENCES);

            // Retrieve the schema that will be used for the different requests
            this._failureHandler = new MC.GAS.API.ResponseHandler<MC.GAS.API.ErrorResponse>(
                PushifySchema.createFailureSchema(),
                x => {
                    let errorResponse = x as ErrorResponseData;
                    return new MC.GAS.API.ErrorResponse(
                        errorResponse.error
                    );
                }
            );
            this._sendSchema = PushifySchema.createSendSchema();
        }

        /**
         * Request from the Pushify API, send the current details as a notification to the registered channel
         * @param title The title that is to be displayed in the received push notification
         * @param body The body text that is to be displayed in the received push notification
         * @param callbackUrl [Optional] A callback URL that can be raised when the user selects the notification
         * @returns Returns either the success return object of the error response
         */
        public sendNotification(title: string, body: string, callbackUrl?: string | null | undefined): SendSuccessResponseData | MC.GAS.API.ErrorResponse {
            // We need to make the request that will be sent
            let request = super.createRequest(
                "post",
                this.getAuthenticationHeaders(),
                {
                    channel: this._preferances.channelTarget,
                    title: title,
                    body: body,
                    url: callbackUrl
                }
            );

            // Get the URL that will be used for sending the request
            let url = super.compileFinalUrl(
                `${this._preferances.apiRoot}/send`
            );

            // Send the request to the endpoint for processing
            return super.sendRequest(
                url,
                request,
                new MC.GAS.API.ResponseHandler<SendSuccessResponseData>(
                    this._sendSchema,
                    x => x as SendSuccessResponseData
                ),
                this._failureHandler
            );
        }
        
        /**
         * Check to see if the specified error object should be considered fatal
         * @param error The error that is to be checked
         * @returns Returns true if the error is fatal and the program can't continue
         */
        public isErrorFatal(error: MC.GAS.API.ErrorResponse): boolean {
            return true;    // All errors here are bad
        }

        //PRIVATE

        /**
         * Create the headers object with the authentication values that can be used for making requests
         * @returns Returns the authentication headers object that can be used for requests
         */
        private getAuthenticationHeaders(): GoogleAppsScript.URL_Fetch.HttpHeaders {
            return {
                Authorization: `Bearer ${this._preferances.apiToken}`
            };
        }
    }
}
