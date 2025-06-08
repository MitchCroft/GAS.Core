namespace MC.GAS.API {
    /**
     * The base class for API handlers that need to send web requests to remote endpoints to process information
     */
    export abstract class APIBase {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if the specified error object should be considered fatal
         * @param error The error that is to be checked
         * @returns Returns true if the error is fatal and the program can't continue
         */
        public abstract isErrorFatal(error: ErrorResponse): boolean;

        //PROTECTED

        /**
         * Compile the final URL with additional query parameters for use
         * @param url The base URL that is to processed with additional elements
         * @param queryParameters [Optional] Additional query parameters that can be appended to the string
         * @returns Returns the final URL string that can be raised to make a request
         */
        protected compileFinalUrl(url: string, queryParameters?: MC.GAS.JObject | null | undefined): string {
            // If there are no query parameters, then we have nothing to do
            if (!queryParameters) {
                return url;
            }

            // Basic helper function to determine how to append the data elements
            let hasExistingQueries = url.lastIndexOf('?') >= 0;
            let addQueryValue = (key: string, value: string) => {
                url += `${(hasExistingQueries ? '&' : '?')}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                hasExistingQueries = true;
            }

            // Otherwise, we have some values to tack on
            for (const key in queryParameters) {
                // How we handle the value will depend on if it's a collection
                let value = queryParameters[key];

                // If this is an array of values, we will need to iterate them
                if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; ++i) {
                        addQueryValue(key, value[i].toString());
                    }
                }

                // Otherwise, we can just append the basic value
                else {
                    addQueryValue(key, value.toString());
                }
            }
            return url;
        }

        /**
         * Create the request body object that can be attached to a request that is sent to an external address
         * @param method The type of web request that is to be made. E.g. get, post, etc.
         * @param headers [Optional] Any headers that need to be attached to the request to be sent
         * @param body [Optional] The body object that will be converted into JSON and attached to the request
         * @returns Returns the object that can be sent as a web request for processing
         */
        protected createRequest(method: GoogleAppsScript.URL_Fetch.HttpMethod, headers?: GoogleAppsScript.URL_Fetch.HttpHeaders, body?: GoogleAppsScript.URL_Fetch.Payload): GoogleAppsScript.URL_Fetch.URLFetchRequestOptions {
            // There are some basic elements that we need
            let request: MC.GAS.JObject = {
                method: method,
                muteHttpExceptions: true
            };

            // The rest of the elements, depend on if they are included
            if (headers) {
                request.headers = headers;
            }

            // If there is a payload to attach
            if (body) {
                request.contentType = "application/json";
                request.payload = JSON.stringify(body);
            }
            return request;
        }

        /**
         * Send a web request to the specified endpoint and process the response data
         * @param endpoint The endpoint URL where the request is to be sent
         * @param request The request body, generated from APIBase.createRequest(...), that will be attached to the message
         * @param successHandler The handler that will be used to process the successful data that is returned from the request
         * @param failureHandler The handler that will be used to process the failure data that is returned from the request
         * @returns Returns the resulting data from the request that needs to be handled, either the success handler response data or an APIErrorResponse for a failure
         */
        protected sendRequest<T>(endpoint: string, request: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions, successHandler: ResponseHandler<T>, failureHandler: ResponseHandler<ErrorResponse>): T | ErrorResponse {
            // We need to sent the request to endpoint for handling
            let response = UrlFetchApp.fetch(endpoint, request);

            // We're assuming things about the response, we'll need to catch anything that goes wrong
            try {
                // Get the response data from the request
                let responseCode = response.getResponseCode();
                let responseData = JSON.parse(response.getContentText());

                // Now we need to figure out the response object that will be returned
                // If this was a failure...
                if (responseCode < 200 || responseCode >= 300) {
                    // We want to try and match the content to the error response schema
                    if (failureHandler.schema.isValid(responseData)) {
                        // Generate the error response from the callback handler
                        let errorResponse = failureHandler.formatData(responseData);

                        // If there is a status code on the return result, we're going to use that
                        return (errorResponse.responseCode ?
                            errorResponse :
                            new ErrorResponse(errorResponse.error, responseCode)
                        );
                    }

                    // If we got here, then we failed to match the data against the failure schema
                    return new ErrorResponse(
                        `An unexpected error occurred. Received a failure response (${responseCode}) from '${endpoint}' but was unable to match against the failure schema\n${failureHandler.schema.failureReason}`,
                        422
                    );
                }

                // That means that this was a success, we should be able to match against it
                if (successHandler.schema.isValid(responseData)) {
                    return successHandler.formatData(responseData);
                }

                // If we couldn't match, it means the data has changed format
                return new ErrorResponse(
                    `An unexpected error occurred. Received a success response (${responseCode}) from '${endpoint}' but was unable to match against the success schema\n${successHandler.schema.failureReason}`,
                    422
                );
            }

            // Anything goes wrong, we're going to make a generic fail response
            catch (ex) {
                return new ErrorResponse(
                    `An unexpected error occurred when processing the response of '${endpoint}'\n${ex.toString()}`,
                    500
                );
            }
        }
    }
}
