import type { MouseEvent } from "react"
import { useContext } from "react"
import { Button, Text } from "@patternfly/react-core"

import names from "../../names"
import { isHealthy } from "./Summary"
import CardInGallery from "../CardInGallery"

import Status, { JobManagerStatus } from "../../Status"
import Settings from "../../Settings"

import { descriptionGroup } from "../DescriptionGroup"

import type { BaseProps } from "../CardInGallery"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

function refreshingMessage({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <Text component="small"> &mdash; {refreshing[0].toUpperCase() + refreshing.slice(1)}</Text>
}

export function summaryGroups(demoMode: boolean, status: null | JobManagerStatus) {
  const statusMessage = demoMode ? "Demo mode" : !status ? "Checking..." : isHealthy(status) ? "Healthy" : "Not ready"

  return [descriptionGroup("Status", statusMessage)]
}

export default function JobManagerCardFn(props: BaseProps) {
  const { status, refreshing, setTo } = useContext(Status)
  const settings = useContext(Settings)
  const demoMode = settings?.demoMode[0] ?? false

  const mouseSetTo = (msg: Refreshing) => (evt: MouseEvent<unknown>) => {
    evt.stopPropagation()
    setTo(msg)
  }

  const initialize = mouseSetTo("initializing")

  const kind = "jobmanager" as const
  const label = names[kind]
  const title = (
    <span>
      {label} {refreshing && refreshingMessage({ refreshing: refreshing })}
    </span>
  )

  const descriptionListProps = { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true }

  const groups = summaryGroups(demoMode, status)

  const footer = !demoMode && status && (!isHealthy(status) || refreshing === "initializing") && (
    <Button isBlock size="lg" onClick={initialize} isLoading={refreshing === "initializing"}>
      {!refreshing ? "Initialize" : "Initializing"}
    </Button>
  )

  return (
    <CardInGallery
      {...props}
      kind={kind}
      label={label}
      title={title}
      groups={groups}
      footer={footer}
      descriptionListProps={descriptionListProps}
    />
  )
}
