namespace MC.GAS.External.Pushify {
    /**
     * Handle the process of sending push notifications via the Pushify API
     */
    export class PushifyPushNotificationHandler implements MC.GAS.PushNotifications.IPushNotificationHandler, MC.GAS.DI.IInjectionTarget, MC.GAS.DI.IInitialisable {
        /*----------Variables----------*/
        //PRIVATE
        
        /**
         * The configuration preferences that will be needed to operate the push notification message that is sent
         */
        private readonly REQUIRED_CONFIG_PREFERENCES: MC.GAS.Config.ConfigurationCollection = Object.freeze({
            enabled: new MC.GAS.Config.ConfigurationEntry("pushify_push_notification_enabled", true),
            priority: new MC.GAS.Config.ConfigurationEntry("pushify_push_notification_priority", true),
        });

        /**
         * The logger that can be used to output information about failed elements
         */
        private _logger: MC.GAS.Logging.ILogger;

        /**
         * The configuration provider that can be used to read in the required values for processing
         */
        private _configurationProvider: MC.GAS.Config.IConfigurationProvider;

        /**
         * The pushify API object that will be used to handle sending the request to the endpoint
         */
        private _pushifyApi: MC.GAS.External.Pushify.PushifyAPI;

        /**
         * The collection of preference values that can be used for processing
         */
        private _preferences: MC.GAS.JObject;

        /*----------Properties----------*/
        //PUBLIC

        /**
         * Flags if this handler is active and enabled, ready for use
         */
        public get enabled(): boolean {
            return this._preferences.enabled === undefined || this._preferences.enabled;
        }

        /**
         * Get the priority that can be used to determine the order of testing for a supported notification handler
         * @comment Returns a number that indicates the priority of the action, where the lower the number the sooner it will be raised
         */
        public get priority(): number {
            return this._preferences.priority === undefined ? 1000 : this._preferences.priority;
        }

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Initialise this object with the default values that are needed for processing
         */
        public constructor() {
            this._logger = null;
            this._configurationProvider = null;
            this._pushifyApi = null;
            this._preferences = null;
        }

        /**
         * Retrieve the required object references for processing the endpoint requests
         * @param resolver The resolver object that will be used to resolve object references
         */
        public construct(resolver: DI.IDependencyResolver): void {
            this._logger = resolver.resolve("ILogger") as MC.GAS.Logging.ILogger;
            this._configurationProvider = resolver.resolve("IConfigurationProvider") as MC.GAS.Config.IConfigurationProvider;
            this._pushifyApi = resolver.resolve("PushifyAPI") as MC.GAS.External.Pushify.PushifyAPI;
        }

        /**
         * Initialise the values that are required to operate this handler
         */
        public init(): void {
            this._preferences = this._configurationProvider.getConfigValues(this.REQUIRED_CONFIG_PREFERENCES);
        }

        /**
         * Try to send the push notification data to the the receivers
         * @param data The push notification data that is to be sent
         * @returns Returns true if the message was able to be sent to the receivers
         */
        public trySendPushNotification(data: MC.GAS.PushNotifications.PushNotificationData): boolean {
            // Try to send the push notification via the API
            let response = this._pushifyApi.sendNotification(data.title, data.body, data.callbackUrl);
            if (!MC.GAS.API.ErrorResponse.isErrorResponse(response)) {
                return true;
            }

            // We've got a problem, couldn't send the notification
            this._logger.error(`Failed to send Pushify Notification - ${response}`);
            return false;
        }
    }
}
