import { useContext } from "react"
import { Button } from "@patternfly/react-core"

import { isHealthy } from "./HealthBadge"
import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import Settings from "@jay/renderer/Settings"
import Status, { JobManagerStatus } from "@jay/renderer/Status"

import type Props from "./Props"

import HomeIcon from "@patternfly/react-icons/dist/esm/icons/laptop-house-icon"
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

/* function refreshingMessage({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <Text component="small"> &mdash; {refreshing[0].toUpperCase() + refreshing.slice(1)}</Text>
} */

export function summaryGroups(demoMode: boolean, status: null | JobManagerStatus, props: Props) {
  const statusMessage = demoMode ? "Demo mode" : !status ? "Checking..." : isHealthy(status) ? "Healthy" : "Not ready"

  return [...(props.spec.isJaaSManager ? [descriptionGroup("Manager Status", statusMessage)] : [])]
}

export default function ComputeTargetCard(props: Props) {
  const { status, refreshing, setTo } = useContext(Status)
  const settings = useContext(Settings)
  const demoMode = settings?.demoMode[0] ?? false

  const mouseSetTo = (msg: Refreshing) => (evt: import("react").MouseEvent<unknown>) => {
    evt.stopPropagation()
    setTo(msg)
  }

  const initialize = mouseSetTo("initializing")

  const name = props.metadata.name.replace(/^kind-/, "")
  // const title = name // `${name}${refreshing ? " " + refreshingMessage({ refreshing: refreshing }) : ""}`

  const descriptionListProps = { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true }

  const groups = summaryGroups(demoMode, status, props)

  const footer = !demoMode &&
    props.spec.isJaaSManager &&
    status &&
    (!isHealthy(status) || refreshing === "initializing") && (
      <Button isBlock onClick={initialize} isLoading={refreshing === "initializing"}>
        {!refreshing ? "Initialize" : "Initializing"}
      </Button>
    )

  return (
    <CardInGallery
      size="sm"
      kind="computetargets"
      name={name}
      groups={groups}
      footer={footer}
      icon={
        props.spec.isJaaSManager ? (
          <HomeIcon className={isHealthy(status) ? "codeflare--status-active" : "codeflare--status-offline"} />
        ) : (
          <ServerIcon />
        )
      }
      descriptionListProps={descriptionListProps}
    />
  )
}
