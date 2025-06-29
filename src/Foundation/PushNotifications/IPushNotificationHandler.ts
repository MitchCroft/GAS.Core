namespace MC.GAS.PushNotifications {
    /**
     * Interface for an object that can be used to send push notification information to receivers
     */
    export interface IPushNotificationHandler {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * Flags if this handler is active and enabled, ready for use
         */
        get enabled(): boolean;

        /**
         * Get the priority that can be used to determine the order of testing for a supported notification handler
         * @comment Returns a number that indicates the priority of the action, where the lower the number the sooner it will be raised
         */
        get priority(): number;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Try to send the push notification data to the the receivers
         * @param data The push notification data that is to be sent
         * @returns Returns true if the message was able to be sent to the receivers
         */
        trySendPushNotification(data: MC.GAS.PushNotifications.PushNotificationData): boolean;
    }
}
