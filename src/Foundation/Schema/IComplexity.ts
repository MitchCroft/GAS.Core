namespace MC.GAS.Schema {
    /**
     * Interface that can be used to retrieve the complexity of the validation elements
     */
    export interface IComplexity {
        /*----------Properties----------*/
        //PUBLIC

        /**
         * Get a representation of the complexity of the validation process
         * @returns Returns a numerical representation of the complexity of the evaluation operation
         * @comment This is used to sort validation rules so the simpler ones can be run first to reduce search time
         */
        get complexity(): number;
    }
}
