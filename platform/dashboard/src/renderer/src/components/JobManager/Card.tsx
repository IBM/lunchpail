import type { MouseEvent } from "react"
import { useContext } from "react"
import { Button, Text } from "@patternfly/react-core"

import names from "../../names"
import { isHealthy } from "./Summary"
import CardInGallery from "../CardInGallery"

import Status, { JobManagerStatus } from "../../Status"
import Settings from "../../Settings"

import { descriptionGroup } from "../DescriptionGroup"

import type { DrilldownProps } from "../../context/DrawerContext"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

function refreshingMessage({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <Text component="small"> &mdash; {refreshing[0].toUpperCase() + refreshing.slice(1)}</Text>
}

type Props = {
  demoMode: boolean
  status: null | JobManagerStatus

  refreshing: Refreshing
  initialize: (evt: MouseEvent<unknown>) => void
}

export function summaryGroups(demoMode: boolean, status: null | JobManagerStatus) {
  const statusMessage = demoMode ? "Demo mode" : !status ? "Checking..." : isHealthy(status) ? "Healthy" : "Not ready"

  return [descriptionGroup("Status", statusMessage)]
}

class JobManagerCard extends CardInGallery<Props> {
  protected override kind() {
    return "jobmanager" as const
  }

  protected override label() {
    return names[this.kind()]
  }

  protected override title() {
    return (
      <span>
        {this.label()} {this.props.refreshing && refreshingMessage({ refreshing: this.props.refreshing })}
      </span>
    )
  }

  protected override icon() {
    return ""
  }

  protected override descriptionListProps() {
    return { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true }
  }

  protected override groups() {
    return summaryGroups(this.props.demoMode, this.props.status)
  }

  protected override footer() {
    return (
      !this.props.demoMode &&
      this.props.status &&
      (!isHealthy(this.props.status) || this.props.refreshing === "initializing") && (
        <Button isBlock size="lg" onClick={this.props.initialize} isLoading={this.props.refreshing === "initializing"}>
          {!this.props.refreshing ? "Initialize" : "Initializing"}
        </Button>
      )
    )
  }
}

export default function JobManagerCardFn(props: DrilldownProps) {
  const { status, refreshing, setTo } = useContext(Status)
  const settings = useContext(Settings)

  const mouseSetTo = (msg: Refreshing) => (evt: MouseEvent<unknown>) => {
    evt.stopPropagation()
    setTo(msg)
  }

  const initialize = mouseSetTo("initializing")

  return (
    <JobManagerCard
      {...props}
      status={status}
      demoMode={settings?.demoMode[0] ?? false}
      refreshing={refreshing}
      initialize={initialize}
    />
  )
}
