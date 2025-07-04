import { ILogger } from "../../../Foundation/Logging";
import { IInjectionTarget, IInitialisable, IDependencyResolver } from "../../../Foundation/DI/Interfaces";
import { WriteAccessHandler } from "../../Handlers";
import { ITimedAction } from "./Interfaces";

/**
 * Controller class that will be used to identify and action the different actions that are required
 */
export class TimedActionController implements IInjectionTarget, IInitialisable {
    /*----------Variables----------*/
    //PRIVATE

    /**
     * The logger interface that will be used to output required information
     */
    private _logger: ILogger | null;

    /**
     * Access guard that will be used to manage the write access of the elements
     */
    private _accessGuard: WriteAccessHandler | null;

    /**
     * The collection of actions that we will be running as a part of this controller
     */
    private _actions: ITimedAction[];

    /*----------Functions----------*/
    //PUBLIC

    /**
     * Initialise this object with the default values that will be used
     */
    public constructor() {
        this._logger = null;
        this._accessGuard = null;
        this._actions = [];
    }

    /**
     * Retrieve the required object references that will be needed to run the input action
     * @param resolver Resolver that can be used to retrieve the required object references
     */
    public construct(resolver: IDependencyResolver): void {
        this._logger = resolver.resolve("ILogger") as ILogger;
        this._accessGuard = resolver.resolve("WriteAccessHandler") as WriteAccessHandler;
        this._actions = resolver.resolveCollection("ITimedAction") as ITimedAction[];
    }

    /**
     * Sort the actions into the order that they will be run
     */
    public init(): void {
        this._actions.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Queue up the actions to be run when we are able to have write access
     */
    public execute(): void {
        if (this._accessGuard === null) {
            throw `NullReferenceException: No WriteAccessHandler instance assigned`
        }
        this._accessGuard.runAction(() => this.executeActions());
    }

    //PRIVATE

    /**
     * Iterate through the different actions that are stored and run them
     */
    private executeActions(): void {
        // We want to run all of the actions, cache exceptions to be raised afterwards
        let exception: any = null;

        // Run through all of the actions in the order they are needed
        for (let i = 0; i < this._actions.length; ++i) {
            // Try to run the actions operation
            try { 
                // Check to see if we can run this action
                if (this._actions[i].canRunAction()) {
                    this._actions[i].runAction(); 
                }
            }

            // We can catch anything that went wrong
            catch (ex) {
                if (this._logger) {
                    this._logger.exception(`Encountered a problem when processing the action '${this._actions[i].name}'`, ex);
                }
                exception = ex;
            }
        }

        // If anyting went wrong, that's not great
        if (exception) {
            throw exception;
        }
    }
}
