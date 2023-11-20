import { Link } from "react-router-dom"
import { useCallback, type MouseEvent, type ReactNode } from "react"
import { Popover, ProgressStepper, ProgressStep, type ProgressStepProps, Truncate } from "@patternfly/react-core"

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

/** A Badge, but with some extra sauce for handling zero/nonzero */
/*function ABadge(props: ({ warnIfZero?: boolean; suffix?: string; children: number })) {
  const label = props.children + (props.suffix ? " " + (props.children === 1 ? props.suffix : props.suffix + "s") : "")
  return props.children > 0 || !props.warnIfZero ? <Badge isRead={props.children===0}>{label}</Badge> : <Badge isRead>{label}</Badge>
}*/

type Item = {
  id: string
  badge?: (props: Props) => ReactNode
  content: (props: Props, isCompact: boolean) => ReactNode
  variant: (props: Props) => ProgressStepProps["variant"]
  icon?: (props: Props) => ReactNode
}

/** An internal error has resulted in an Application with no TaskQueue */
const oopsNoQueue = `Configuration error: no queue is associated with this ${singular}`

const items: Item[] = [
  {
    id: "Code",
    variant: () => "success",
    content: (props, isCompact) => (
      <span>
        Code will be pulled from{" "}
        <Link target="_blank" to={props.application.spec.repo}>
          {isCompact ? repoPlusSource(props) : <Truncate content={repoPlusSource(props)} />}
        </Link>
      </span>
    ),
  },
  {
    id: "Data",
    // badge: (props) => <ABadge>{datasets(props).length}</ABadge>,
    variant: (props) => (datasets(props).length > 0 ? "success" : "default"),
    content: (props) => {
      const data = datasets(props)
      if (data.length === 0) {
        return (
          <span>
            If your {singular} needs access to a {datasetSingular}, link it in.{" "}
            <LinkToNewDataSet isInline action="create" />
          </span>
        )
      } else {
        return (
          <span>
            Your {singular} has access to {data.length === 1 ? "this" : "these"} {datasetSingular}:
            <div>{linkToAllDetails("datasets", data)}</div>
          </span>
        )
      }
    },
  },
  {
    id: "Work Dispatcher",
    // badge: (props) => <ABadge warnIfZero>{workdispatchers(props).length}</ABadge>,
    variant: (props) => (workdispatchers(props).length > 0 ? "info" : "warning"),
    content: (props) => {
      const queue = taskqueueProps(props)
      const dispatchers = workdispatchers(props)

      if (!queue) {
        return oopsNoQueue
      } else if (dispatchers.length === 0) {
        return (
          <span>
            You will need specify how to feed the task queue.{" "}
            <NewWorkDispatcherButton isInline {...props} queueProps={queue} />
          </span>
        )
      } else {
        return linkToAllDetails("workdispatchers", dispatchers)
      }
    },
  },
  {
    id: "Compute",
    // badge: (props) => <ABadge warnIfZero suffix="pool">{associatedWorkerPools(props).length}</ABadge>,
    variant: (props) => (associatedWorkerPools(props).length > 0 ? "info" : "warning"),
    content: (props) => {
      const queue = taskqueueProps(props)
      const pools = associatedWorkerPools(props)

      if (!queue) {
        return oopsNoQueue
      } else if (pools.length === 0) {
        return (
          <span>
            No workers assigned, yet. <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" />
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

export default function AplicationAccordion(props: Props & { isCompact?: boolean }) {
  const popoverRenders = !props.isCompact
    ? []
    : items.map((item) =>
        useCallback(
          (stepRef) => (
            <Popover
              position="bottom"
              aria-label={`${item.id} help`}
              headerContent={item.id}
              bodyContent={item.content(props, !!props.isCompact)}
              triggerRef={stepRef}
            />
          ),
          [props],
        ),
      )

  return (
    <ProgressStepper isVertical={!props.isCompact}>
      {items.map((item, idx) => (
        <ProgressStep
          key={item.id}
          isCurrent={!props.isCompact}
          variant={item.variant(props)}
          icon={item.icon && item.icon(props)}
          id={item.id}
          titleId={item.id}
          description={!props.isCompact && item.content(props, !!props.isCompact)}
          popoverRender={popoverRenders[idx]}
          onClick={stopPropagation}
        >
          {item.id} {item.badge && item.badge(props)}
        </ProgressStep>
      ))}
    </ProgressStepper>
  )
}
