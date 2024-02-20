// this is the Step type
import type Step from "../Step"

// these are the Step impls
import Code from "./Code"
import Data from "./Data"
import Compute from "./Compute"
import WorkDispatcher from "./WorkDispatcher"

/** These are the Steps we want to display in the `ProgressStepper` UI */
const steps: Step[] = [Code, Data, WorkDispatcher, Compute]

export default steps
