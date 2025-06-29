namespace MC.GAS.PushNotifications {
    /**
     * The collection of data that can be sent to the external receiver
     */
    export class PushNotificationData {
        /*----------Variables----------*/
        //PUBLIC

        /**
         * The title that will be assigned to the display push notification
         */
        public title: string;

        /**
         * The body of text that will be shown on the push notification
         */
        public body: string | null;

        /**
         * The callback URL that should be raised if the push notification is selected
         */
        public callbackUrl: string | null;
    }
}
