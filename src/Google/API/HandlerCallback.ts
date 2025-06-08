namespace MC.GAS.API {
    /**
     * The callback function type that will be used to process the responses from a web request
     */
    export type HandlerCallback<T> = (responseData: MC.GAS.JObject) => T | ErrorResponse;
}