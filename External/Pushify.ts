import { JObject } from "../Foundation/Objects"
import { ILogger } from "../Foundation/Logging"
import { Schema } from "../Foundation/Schema/Objects"
import { SchemaBuilder } from "../Foundation/Schema/Builders"
import { BasicValueValidation, BasicType } from "../Foundation/Schema/Validation"
import { IInjectionTarget, IInitialisable, IDependencyResolver } from "../Foundation/DI/Interfaces"
import { IConfigurationProvider, ConfigurationCollection, ConfigurationEntry } from "../Foundation/Configuration"
import { APIBase, ErrorResponse, ResponseHandler } from "../Google/API"
import { IPushNotificationHandler, PushNotificationData } from "../Foundation/PushNotifications"

/**
 * The data container for the success response from the API server
 */
export type SendSuccessResponseData = {
    success: boolean
}    

/**
 * The data container for the error response from the API server
 */
export type ErrorResponseData = {
    error: string
}

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
    public static createFailureSchema(): Schema {
        return new SchemaBuilder()
            .addProperty("error")
                .addValueValidation(new BasicValueValidation(BasicType.String))
            .build();
    }

    /**
     * Create the schema that represents a successful response from sending the data
     * @returns Returns a schema description for a valid return from "/send"
     */
    public static createSendSchema(): Schema {
        return new SchemaBuilder()
            .addProperty("success")
                .addValueValidation(new BasicValueValidation(BasicType.Boolean))
            .build();
    }
}

/**
 * Manage the API values that are needed to perform the remote interactions with the Pushify API
 */
export class PushifyAPI extends APIBase implements IInjectionTarget, IInitialisable {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The collection of preference values that will be needed for processing the Pushify API requests
     */
    private readonly REQUIRED_PEREFERENCES: ConfigurationCollection = Object.freeze({
        apiRoot: new ConfigurationEntry("pushify_api_root"),
        apiToken: new ConfigurationEntry("pushify_api_token"),
        channelTarget: new ConfigurationEntry("pushify_channel_target")
    });

    /**
     * The configuration provider that will be used to retrieve the settings needed to operate
     */
    private _configurationProvider: IConfigurationProvider | null;

    /**
     * The collection of preference values that can be read and processed
     */
    private _preferances: JObject | null;

    /**
     * We will need a set of schema that are used to process the various requests that are sent as a part of this API
     */
    private _failureHandler: ResponseHandler<ErrorResponse> | null;
    private _sendSchema: Schema | null;

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
        this._sendSchema = null;
    }

    /**
     * Inject the required object references into this object for use
     * @param resolver Retrieve the object references that are required for processing requests
     */
    public construct(resolver: IDependencyResolver): void {
        this._configurationProvider = resolver.resolve("IConfigurationProvider") as IConfigurationProvider;
    }

    /**
     * Setup the collection of values that will be used to process requests
     */
    public init(): void {
        // Get the configuration values that are needed for processing
        if (this._configurationProvider === null) {
            throw `NullReferenceException: No IConfigurationProvider is assigned`;
        }
        this._preferances = this._configurationProvider.getConfigValues(this.REQUIRED_PEREFERENCES);

        // Retrieve the schema that will be used for the different requests
        this._failureHandler = new ResponseHandler<ErrorResponse>(
            PushifySchema.createFailureSchema(),
            x => {
                let errorResponse = x as ErrorResponseData;
                return new ErrorResponse(
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
    public sendNotification(title: string, body: string, callbackUrl?: string | null | undefined): SendSuccessResponseData | ErrorResponse {
        // Check the values required have been set
        if (this._preferances === null || this._sendSchema === null || this._failureHandler === null) {
            throw `NullReferenceException: Values required to send the API request have not been set. Make sure construct and init have been called before raising`;
        }

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
            new ResponseHandler<SendSuccessResponseData>(
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
    public isErrorFatal(error: ErrorResponse): boolean {
        return true;    // All errors here are bad
    }

    //PRIVATE

    /**
     * Create the headers object with the authentication values that can be used for making requests
     * @returns Returns the authentication headers object that can be used for requests
     */
    private getAuthenticationHeaders(): GoogleAppsScript.URL_Fetch.HttpHeaders {
        if (this._preferances === null) {
            throw `NullReferenceException: Preferance values have no been received, unable to get authentication headers`;
        }
        return {
            Authorization: `Bearer ${this._preferances.apiToken}`
        };
    }
}

/**
 * Handle the process of sending push notifications via the Pushify API
 */
export class PushifyPushNotificationHandler implements IPushNotificationHandler, IInjectionTarget, IInitialisable {
    /*----------Variables----------*/
    //PRIVATE
        
    /**
     * The configuration preferences that will be needed to operate the push notification message that is sent
     */
    private readonly REQUIRED_CONFIG_PREFERENCES: ConfigurationCollection = Object.freeze({
        enabled: new ConfigurationEntry("pushify_push_notification_enabled", true),
        priority: new ConfigurationEntry("pushify_push_notification_priority", true),
    });

    /**
     * The logger that can be used to output information about failed elements
     */
    private _logger: ILogger | null;

    /**
     * The configuration provider that can be used to read in the required values for processing
     */
    private _configurationProvider: IConfigurationProvider | null;

    /**
     * The pushify API object that will be used to handle sending the request to the endpoint
     */
    private _pushifyApi: PushifyAPI | null;

    /**
     * The collection of preference values that can be used for processing
     */
    private _preferences: JObject | null;

    /*----------Properties----------*/
    //PUBLIC

    /**
     * Flags if this handler is active and enabled, ready for use
     */
    public get enabled(): boolean {
        return !this._preferences || this._preferences.enabled === undefined || this._preferences.enabled;
    }

    /**
     * Get the priority that can be used to determine the order of testing for a supported notification handler
     * @comment Returns a number that indicates the priority of the action, where the lower the number the sooner it will be raised
     */
    public get priority(): number {
        return !this._preferences || this._preferences.priority === undefined ? 1000 : this._preferences.priority;
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
    public construct(resolver: IDependencyResolver): void {
        this._logger = resolver.resolve("ILogger") as ILogger;
        this._configurationProvider = resolver.resolve("IConfigurationProvider") as IConfigurationProvider;
        this._pushifyApi = resolver.resolve("PushifyAPI") as PushifyAPI;
    }

    /**
     * Initialise the values that are required to operate this handler
     */
    public init(): void {
        if (this._configurationProvider === null) {
            throw `NullReferenceException: The IConfigurationProvider property hasn't been set`;
        }
        this._preferences = this._configurationProvider.getConfigValues(this.REQUIRED_CONFIG_PREFERENCES);
    }

    /**
     * Try to send the push notification data to the the receivers
     * @param data The push notification data that is to be sent
     * @returns Returns true if the message was able to be sent to the receivers
     */
    public trySendPushNotification(data: PushNotificationData): boolean {
        // If there is no API object, nothing we can do
        if (this._pushifyApi === null) {
            throw `NullReferenceException: The PushifyAPI property hasn't been set`;
        }

        // Try to send the push notification via the API
        let response = this._pushifyApi.sendNotification(data.title, data.body ?? "", data.callbackUrl);
        if (!ErrorResponse.isErrorResponse(response)) {
            return true;
        }

        // We've got a problem, couldn't send the notification
        if (this._logger) {
            this._logger.error(`Failed to send Pushify Notification - ${response}`);
        }
        return false;
    }
}
