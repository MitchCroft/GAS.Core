import { ILogger } from "./Logging";
import { IInjectionTarget, IInitialisable, IDependencyResolver } from "./DI/Interfaces";

/**
 * The collection of data that can be sent to the external receiver
 */
export type PushNotificationData = {
    /*----------Variables----------*/
    //PUBLIC

    /**
     * The title that will be assigned to the display push notification
     */
    title: string;

    /**
     * The body of text that will be shown on the push notification
     */
    body: string | null;

    /**
     * The callback URL that should be raised if the push notification is selected
     */
    callbackUrl: string | null;
}

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
    trySendPushNotification(data: PushNotificationData): boolean;
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

/**
 * Handle the collating of the different push notification services that are available for use and attempt to
 * dispatch the requests to the registered listeners as required
 */
export class PushNotificationDispatcher implements IInjectionTarget, IInitialisable {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The strategy that should be used when processing the push notification strategy
     */
    private readonly _strategy: PushNotificationStrategy;

    /**
     * The logger object that will be used to output information as needed
     */
    private _logger: ILogger | null;

    /**
     * The collection of push notification handlers that will be used to process the requests to be made
     */
    private _notificationHandlers: IPushNotificationHandler[];

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Initialise this object with the default values
     * @param strategy The strategy that should be used when processing the push notifications that are sent
     */
    public constructor(strategy: PushNotificationStrategy) {
        this._strategy = strategy;
        this._logger = null;
        this._notificationHandlers = [];
    }

    /**
     * Handle the resolving of the required dependencies
     * @param resolver Resolver that can be used to receive the required object references
     */
    public construct(resolver: IDependencyResolver): void {
        this._logger = resolver.resolve("ILogger") as ILogger;
        this._notificationHandlers = resolver.resolveCollection("IPushNotificationHandler") as IPushNotificationHandler[];
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
    public sendPushNotification(data: PushNotificationData): boolean {
        // Flag if we were able to find a receiver that could send the message
        let success = false;

        // Test the handlers to see if there is one we can use
        for (let i = 0; i < this._notificationHandlers.length; ++i) {
            // Check to see if this handler can be used
            if (this._notificationHandlers[i].enabled === false) {
                continue;
            }

            // Try to send the notification via the handler
            if (this._notificationHandlers[i].trySendPushNotification(data) === false) {
                this._logger?.error(`Was unable to send a push notification via handler ${i} '${this._notificationHandlers[i]}'`);
                continue;
            }

            // If we are only doing the first handler to work, then we are done
            success = true;
            if (this._strategy === PushNotificationStrategy.FirstToWork) {
                break;
            }
        }

        // We're good if we could find a dispatcher to send the message via
        if (success === true) {
            return true;
        }

        // Otherwise, we may have a problem
        this._logger?.error(`PushNotificationDispatcher: Failed to find a IPushNotificationHandler instance (out of ${this._notificationHandlers.length}) that could dispatch a message`);
        return false;
    }
}
