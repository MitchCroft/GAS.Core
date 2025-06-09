namespace MC.GAS.Controllers.Endpoints {
    /**
     * Manage the execution of a POST web request for the required operations
     */
    export class PostEndpointController extends BaseEndpointController<GoogleAppsScript.Events.DoPost> {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The collection of properties that are required for operating the POST logic
         */
        private readonly REQUIRED_PREFERENCES: MC.GAS.Config.ConfigurationCollection;

        /**
         * The collection of preference values that have been received for processing
         */
        private _preferences: MC.GAS.JObject;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Create this object with the default object references
         * @param authConfigKey The configuration preference key that will be used for validing all requests made of this controller
         */
        public constructor(authConfigKey: string) {
            super();
            this.REQUIRED_PREFERENCES = Object.freeze({
                authToken: new MC.GAS.Config.ConfigurationEntry(authConfigKey)
            });
            this._preferences = null;
        }

        /**
         * Initialise this object so that it's ready to be used
         */
        public init(): void {
            super.init();
            this._preferences = this._configurationProvider.getConfigValues(this.REQUIRED_PREFERENCES);
        }

        //PROTECTED

        /**
         * Allows implementing classes to format the supplied data and return a generic object that can be processed
         * @param eventData The event data object that has been passed and needs to be processed
         * @returns Returns the JSON object with all the values sent by the user ready to be processed
         */
        protected retrieveInputData(eventData: GoogleAppsScript.Events.DoPost): MC.GAS.JObject {
            return JSON.parse(eventData.postData.contents);
        }

        /**
         * Retrieve the authentication token that must be matched against for the required endpoint to work
         * @returns Returns a string that will be matched against the supplied input data or null if no authentication is required
         */
        protected getAuthenticationToken(): string {
            return this._preferences.authToken;
        }
    }
}
