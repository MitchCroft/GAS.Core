namespace MC.GAS.DI {
    /**
     * Denotes a class that requires additional initialisation after being constructed
     */
    export interface IInitialisable {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Process the initialisation of contained values as required
         */
        init(): void;
    }

    /**
     * Utility class to help with identifying initialisation objects
     */
    export class InitialisationUtility {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Check to see if an object matches the IInitialisable interface
         * @param obj The object that is to be checked against the interface
         * @returns Returns true if the object is of the interface type
         */
        static isInterface(obj: any): obj is IInitialisable {
            return typeof obj.init === "function";
        }
    }
}
