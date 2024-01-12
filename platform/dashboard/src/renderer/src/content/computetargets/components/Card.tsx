import { useCallback, useContext } from "react"
import { Button } from "@patternfly/react-core"

import Icon from "./Icon"
import type Props from "./Props"
import { isHealthy, status } from "./HealthBadge"

import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import Settings from "@jay/renderer/Settings"

export function summaryGroups(demoMode: boolean, props: Props) {
  const statusMessage = demoMode ? "Demo mode" : !status ? "Checking..." : isHealthy(props) ? "Healthy" : "Not ready"

  return [...(props.spec.jaasManager ? [descriptionGroup("Manager Status", statusMessage)] : [])]
}

const descriptionListProps = { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true }

export default function ComputeTargetCard(props: Props) {
  const settings = useContext(Settings)
  const demoMode = settings?.demoMode[0] ?? false

  const initialize = useCallback(
    () => window.jay.controlplane.init(props.metadata.name),
    [window.jay.controlplane.init],
  )

  const { name } = props.metadata
  const title = name.replace(/^kind-/, "")

  const currentStatus = status(props)

  const groups = summaryGroups(demoMode, props)

  const footer = !demoMode && !!props.spec.jaasManager && (!isHealthy(props) || currentStatus === "initializing") && (
    <Button isBlock onClick={initialize} isLoading={currentStatus === "initializing"}>
      {!isHealthy(props) ? "Initialize" : "Initializing"}
    </Button>
  )

  return (
    <CardInGallery
      size="sm"
      kind="computetargets"
      name={name}
      title={title}
      groups={groups}
      footer={footer}
      icon={<Icon {...props} />}
      descriptionListProps={descriptionListProps}
    />
  )
}
