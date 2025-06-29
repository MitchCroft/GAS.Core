namespace MC.GAS.External.Pushify {
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
}
