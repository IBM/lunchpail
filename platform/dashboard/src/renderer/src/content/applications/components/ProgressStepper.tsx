import { Link } from "react-router-dom"
import { useCallback, useState, type MouseEvent, type ReactNode } from "react"
import { Popover, ProgressStepper, ProgressStep, type ProgressStepProps } from "@patternfly/react-core"

import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"
import NewWorkDispatcherButton from "./actions/NewWorkDispatcher"
import { LinkToNewDataSet } from "../../datasets/components/New/Button"

import type Props from "./Props"

import { groupSingular as singular } from "../group"
import { singular as datasetSingular } from "../../datasets/name"

import { repoPlusSource } from "./tabs/Code"
import { associatedWorkerPools } from "./common"
import taskqueueProps, { datasets } from "./taskqueueProps"

/** @return the WorkDispatchers associated with `props.application` */
function workdispatchers(props: Props) {
  return props.workdispatchers.filter((_) => _.spec.application === props.application.metadata.name)
}

/** An internal error has resulted in an Application with no TaskQueue */
const oopsNoQueue = `Configuration error: no queue is associated with this ${singular}`

/** Configuration of one Step of the `ProgressStepper` UI */
type Step = {
  id: string
  content: (props: Props, onClick: () => void) => ReactNode
  variant: (props: Props) => ProgressStepProps["variant"]
  icon?: (props: Props) => ReactNode
}

/** These are the Steps we want to display in the `ProgressStepper` UI */
const steps: Step[] = [
  {
    id: "Code",
    variant: () => "success",
    content: (props, onClick) => (
      <span>
        Code will be pulled from{" "}
        <Link onClick={onClick} target="_blank" to={props.application.spec.repo}>
          {repoPlusSource(props)}
        </Link>
      </span>
    ),
  },
  {
    id: "Data",
    variant: (props) => (datasets(props).length > 0 ? "success" : "default"),
    content: (props, onClick) => {
      const data = datasets(props)
      if (data.length === 0) {
        return (
          <span>
            If your {singular} needs access to a {datasetSingular}, link it in.{" "}
            <div>
              <LinkToNewDataSet isInline action="create" onClick={onClick} />
            </div>
          </span>
        )
      } else {
        return (
          <span>
            Your {singular} has access to {data.length === 1 ? "this" : "these"} {datasetSingular}:
            <div>{linkToAllDetails("datasets", data, undefined, onClick)}</div>
          </span>
        )
      }
    },
  },
  {
    id: "Work Dispatcher",
    variant: (props) => (workdispatchers(props).length > 0 ? "info" : "warning"),
    content: (props, onClick) => {
      const queue = taskqueueProps(props)
      const dispatchers = workdispatchers(props)

      if (!queue) {
        return oopsNoQueue
      } else if (dispatchers.length === 0) {
        return (
          <span>
            You will need specify how to feed the task queue.{" "}
            <div>
              <NewWorkDispatcherButton isInline {...props} queueProps={queue} onClick={onClick} />
            </div>
          </span>
        )
      } else {
        return linkToAllDetails("workdispatchers", dispatchers)
      }
    },
  },
  {
    id: "Compute",
    variant: (props) => (associatedWorkerPools(props).length > 0 ? "info" : "warning"),
    content: (props, onClick) => {
      const queue = taskqueueProps(props)
      const pools = associatedWorkerPools(props)

      if (!queue) {
        return oopsNoQueue
      } else if (pools.length === 0) {
        return (
          <span>
            No workers assigned, yet.
            <div>
              <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" onClick={onClick} />
            </div>
          </span>
        )
      } else {
        return linkToAllDetails("workerpools", pools)
      }
    },
  },
]

function stopPropagation(evt: MouseEvent) {
  return evt.stopPropagation()
}

export default function AplicationAccordion(props: Props) {
  const [isVisible, setIsVisible] = useState<boolean[]>(Array(steps.length).fill(false))

  const visibleSet = (isVisible: boolean) =>
    Array(steps.length)
      .fill(0)
      .map((_, idx) =>
        useCallback(
          () => setIsVisible((curState) => [...curState.slice(0, idx), isVisible, ...curState.slice(idx + 1)]),
          [],
        ),
      )
  const visibleOn = visibleSet(true)
  const visibleOff = visibleSet(false)

  const popovers = steps.map((step, idx) =>
    useCallback(
      (stepRef) => (
        <Popover
          position="bottom"
          isVisible={isVisible[idx]}
          shouldOpen={visibleOn[idx]}
          shouldClose={visibleOff[idx]}
          aria-label={`${step.id} help`}
          headerContent={step.id}
          bodyContent={step.content(props, visibleOff[idx])}
          triggerRef={stepRef}
        />
      ),
      [props, isVisible[idx]],
    ),
  )

  return (
    <ProgressStepper>
      {steps.map((step, idx) => (
        <ProgressStep
          key={step.id}
          variant={step.variant(props)}
          icon={step.icon && step.icon(props)}
          id={step.id}
          titleId={step.id}
          popoverRender={popovers[idx]}
          onClick={stopPropagation}
        >
          {step.id}
        </ProgressStep>
      ))}
    </ProgressStepper>
  )
}
