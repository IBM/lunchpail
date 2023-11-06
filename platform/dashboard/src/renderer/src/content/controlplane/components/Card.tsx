import { useContext, type MouseEvent } from "react"
import { Button, Text } from "@patternfly/react-core"

import { isHealthy } from "./HealthBadge"
import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import Settings from "@jay/renderer/Settings"
import Status, { JobManagerStatus } from "@jay/renderer/Status"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

function refreshingMessage({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <Text component="small"> &mdash; {refreshing[0].toUpperCase() + refreshing.slice(1)}</Text>
}

export function summaryGroups(demoMode: boolean, status: null | JobManagerStatus) {
  const statusMessage = demoMode ? "Demo mode" : !status ? "Checking..." : isHealthy(status) ? "Healthy" : "Not ready"

  return [descriptionGroup("Status", statusMessage)]
}

export default function JobManagerCard() {
  const { status, refreshing, setTo } = useContext(Status)
  const settings = useContext(Settings)
  const demoMode = settings?.demoMode[0] ?? false

  const mouseSetTo = (msg: Refreshing) => (evt: MouseEvent<unknown>) => {
    evt.stopPropagation()
    setTo(msg)
  }

  const initialize = mouseSetTo("initializing")

  const kind = "controlplane"
  const name = "Job Manager"
  const title = (
    <span>
      {name} {refreshing && refreshingMessage({ refreshing: refreshing })}
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
      kind={kind}
      name={name}
      title={title}
      groups={groups}
      footer={footer}
      descriptionListProps={descriptionListProps}
    />
  )
}
