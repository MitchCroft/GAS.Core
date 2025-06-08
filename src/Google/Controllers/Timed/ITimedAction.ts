namespace MC.GAS.Controllers.Timed {
    /**
     * Defines an interface for an update action that can be called automatically to update any
     * required information
     */
    export interface ITimedAction extends MC.GAS.DI.IInjectionTarget {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * The name of the action that can be used for debug purposes
         */
        get name(): string;

        /**
         * Retrieve the priority for this action so they can be performed in order
         * @returns Returns a number that indicates the priority of the action, where the lower the number the sooner it will be raised
         */
        get priority(): number;

        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if the specified action is able to be run
         */
        canRunAction(): boolean;

        /**
         * Callback that will be raised to handle the processing of the required elements
         */
        runAction(): void;
    }
}
