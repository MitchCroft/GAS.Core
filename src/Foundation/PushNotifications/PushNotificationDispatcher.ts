namespace MC.GAS.PushNotifications {
    /**
     * Handle the collating of the different push notification services that are available for use and attempt to
     * dispatch the requests to the registered listeners as required
     */
    export class PushNotificationDispatcher implements MC.GAS.DI.IInjectionTarget, MC.GAS.DI.IInitialisable {
        /*----------Variables----------*/
        //PRIVATE

        /**
         * The strategy that should be used when processing the push notification strategy
         */
        private readonly _strategy: PushNotificationStrategy;

        /**
         * The logger object that will be used to output information as needed
         */
        private _logger: MC.GAS.Logging.ILogger;

        /**
         * The collection of push notification handlers that will be used to process the requests to be made
         */
        private _notificationHandlers: MC.GAS.PushNotifications.IPushNotificationHandler[];

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Initialise this object with the default values
         * @param strategy The strategy that should be used when processing the push notifications that are sent
         */
        public constructor(strategy: PushNotificationStrategy) {
            this._strategy = strategy;
            this._logger = null;
            this._notificationHandlers = null;
        }

        /**
         * Handle the resolving of the required dependencies
         * @param resolver Resolver that can be used to receive the required object references
         */
        public construct(resolver: DI.IDependencyResolver): void {
            this._logger = resolver.resolve("ILogger") as MC.GAS.Logging.ILogger;
            this._notificationHandlers = resolver.resolveCollection("IPushNotificationHandler") as MC.GAS.PushNotifications.IPushNotificationHandler[];
        }

        /**
         * Initialise this object for use within the application
         */
        public init(): void {
            this._notificationHandlers.sort((a, b) => a.priority - b.priority);
        }

        /**
         * Send the supplied data as a push notification via the contained handlers and the specified strategy
         * @param data The data that is to be sent as a push notification to the receivers
         */
        public sendPushNotification(data: MC.GAS.PushNotifications.PushNotificationData): boolean {
            // Flag if we were able to find a receiver that could send the message
            let success = false;

            // Test the handlers to see if there is one we can use
            for (let i = 0; i < this._notificationHandlers.length; ++i) {
                // Check to see if this handler can be used
                if (!this._notificationHandlers[i].enabled) {
                    continue;
                }

                // Try to send the notification via the handler
                if (!this._notificationHandlers[i].trySendPushNotification(data)) {
                    this._logger.error(`Was unable to send a push notification via handler ${i} '${this._notificationHandlers[i]}'`);
                    continue;
                }

                // If we are only doing the first handler to work, then we are done
                success = true;
                if (this._strategy === PushNotificationStrategy.FirstToWork) {
                    break;
                }
            }

            // We're good if we could find a dispatcher to send the message via
            if (success) {
                return true;
            }

            // Otherwise, we may have a problem
            this._logger.error(`PushNotificationDispatcher: Failed to find a IPushNotificationHandler instance (out of ${this._notificationHandlers.length}) that could dispatch a message`);
            return false;
        }
    }

    /**
     * The strategy that will be used when processing the push notification handlers
     */
    export enum PushNotificationStrategy {
        /**
         * Work down the list of push notification handlers until we find one that can be used
         */
        FirstToWork,

        /**
         * Try to send the push notification to all of the registered push notification handlers
         */
        All,
    }
}
