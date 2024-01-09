import { useContext, useCallback } from "react"
import { Switch } from "@patternfly/react-core"

import Status from "@jay/renderer/Status"
import Settings from "@jay/renderer/Settings"

import { summaryGroups } from "./Card"
import DrawerContent from "@jay/components/Drawer/Content"

import camelCaseSplit from "@jay/renderer/util/camel-split"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"
import { descriptions } from "@jay/common/status/JobManagerStatus"

import type Props from "./Props"

export default function JobManagerDetail(props: Props) {
  const status = useContext(Status)
  const settings = useContext(Settings)

  const demoMode = settings?.demoMode[0] ?? false

  const rest =
    demoMode || !status.status
      ? []
      : Object.entries(status.status).map(([key, value]) =>
          descriptionGroup(camelCaseSplit(key), value, undefined, descriptions[key]),
        )

  const toggle = useCallback(
    () => status.setTo((current) => (current === null ? "destroying" : "initializing")),
    [status],
  )
  // const destroyButtonIsLoading = status.refreshing === "destroying"

  const rightActions = [
    <Switch
      key="jaas-toggler"
      hasCheckIcon
      onClick={toggle}
      isDisabled={status.refreshing !== null}
      data-ouia-component-id="comptueTargetEnableSwitch"
      isChecked={props.spec.isJaaSWorkerHost}
      label={
        status.refreshing === "destroying"
          ? "Deprovisioning"
          : status.refreshing === "initializing"
            ? "Initializing"
            : "JaaS Enabled"
      }
    />,
  ]

  const summary = <DescriptionList groups={[...summaryGroups(demoMode, status.status, props), ...rest]} />

  return <DrawerContent summary={summary} raw={props} rightActions={rightActions} />
}
