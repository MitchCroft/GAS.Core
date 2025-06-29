namespace MC.GAS.PushNotifications {
    /**
     * Provide a push notification handler that can be used to process the sending of push notifications via sending an email message
     */
    export class GMailPushNotificationHandler implements MC.GAS.PushNotifications.IPushNotificationHandler, MC.GAS.DI.IInjectionTarget, MC.GAS.DI.IInitialisable {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The configuration preferences that will be needed to operate the push notification message that is sent
         */
        private readonly REQUIRED_CONFIG_PREFERENCES: MC.GAS.Config.ConfigurationCollection = Object.freeze({
            target: new MC.GAS.Config.ConfigurationEntry("gmail_push_notification_target"),
            enabled: new MC.GAS.Config.ConfigurationEntry("gmail_push_notification_enabled", true),
            priority: new MC.GAS.Config.ConfigurationEntry("gmail_push_notification_priority", true),
            senderAlias: new MC.GAS.Config.ConfigurationEntry("gmail_push_notification_send_alias", true)
        });

        /**
         * The logger that can be used to output information about the ongoing process
         */
        private _logger: MC.GAS.Logging.ILogger;

        /**
         * The configuration provider that can be used to read in the required values for processing
         */
        private _configurationProvider: MC.GAS.Config.IConfigurationProvider;

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
            this._preferences = null;
        }

        /**
         * Retrieve the required object references for processing the endpoint requests
         * @param resolver The resolver object that will be used to resolve object references
         */
        public construct(resolver: DI.IDependencyResolver): void {
            this._logger = resolver.resolve("ILogger") as MC.GAS.Logging.ILogger;
            this._configurationProvider = resolver.resolve("IConfigurationProvider") as MC.GAS.Config.IConfigurationProvider;
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
            // Figure out if there is a callback that can be used
            let htmlBody = null;
            if (data.callbackUrl) {
                htmlBody = `<p>${data.body}</p><br><br><a href="${data.callbackUrl}">See here for additional information</a>`;
            }

            // Blanket, we send the message without exception and we are successful
            try {
                GmailApp.sendEmail(
                    this._preferences.target,
                    data.title,
                    data.body,
                    {
                        htmlBody: htmlBody,
                        from: this._preferences.senderAlias
                    }
                );
                return true;
            }

            // Anything goes wrong, and we failed
            catch (ex) {
                this._logger.exception("Encountered an exception when attempting to send the GMail Push Notification", ex);
                return false;
            }
        }
    }
}
