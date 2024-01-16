import { useCallback } from "react"
import { Button } from "@patternfly/react-core"

import Icon from "./Icon"
import type Props from "./Props"
import { isHealthyControlPlane as isHealthy, status } from "./HealthBadge"

import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

export function summaryGroups(props: Props) {
  const statusMessage = status(props)

  return [
    descriptionGroup(
      "Role",
      props.spec.jaasManager ? "JaaS Manager" : props.spec.isJaaSWorkerHost ? "Worker Host" : "Not JaaS-enabled",
    ),
    descriptionGroup("Status", statusMessage),
    descriptionGroup("Type", props.spec.type),
  ]
}

const descriptionListProps = { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true }

export default function ComputeTargetCard(props: Props) {
  const initialize = useCallback(
    () => window.jay.controlplane.init(props.metadata.name),
    [window.jay.controlplane.init],
  )

  const { name } = props.metadata
  const title = name.replace(/^kind-/, "")

  const currentStatus = status(props)

  const groups = summaryGroups(props)

  const footer = !!props.spec.jaasManager && (!isHealthy(props) || currentStatus === "initializing") && (
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
