import { useContext, useCallback } from "react"
import { Spinner, Switch, Tooltip } from "@patternfly/react-core"

import Status from "@jay/renderer/Status"
import Settings from "@jay/renderer/Settings"
import camelCaseSplit from "@jay/renderer/util/camel-split"
import DrawerContent from "@jay/components/Drawer/Content"

import { summaryGroups } from "./Card"

import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"
import { descriptions } from "@jay/common/status/JobManagerStatus"

import { singular as computetarget } from "@jay/renderer/content/computetargets/name"
import { name as computepools, singular as computepool } from "@jay/renderer/content/workerpools/name"

import DeleteAction from "./actions/delete"

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

  const tooltip =
    status.refreshing === "destroying"
      ? `Removing JaaS support from this ${computetarget}`
      : status.refreshing === "initializing"
        ? `Installing JaaS support on this ${computetarget}`
        : props.spec.isJaaSWorkerHost
          ? `This ${computetarget} is enabled to run ${computepools} Workers. Click to remove.`
          : `If you wish to run ${computepool} Workers on this ${computetarget}, click to add this capability.`

  const rightActions = [
    <Tooltip key="jaas-toggler" position="left-end" content={tooltip}>
      <Switch
        hasCheckIcon
        isReversed
        onClick={toggle}
        isDisabled={status.refreshing !== null}
        data-ouia-component-id="comptueTargetEnableSwitch"
        isChecked={props.spec.isJaaSWorkerHost}
        label={
          status.refreshing === "destroying" ? (
            <>
              <Spinner size="sm" />
              Deprovisioning
            </>
          ) : status.refreshing === "initializing" ? (
            <>
              <Spinner size="sm" />
              Initializing
            </>
          ) : (
            "Enabled for JaaS Workers"
          )
        }
        labelOff="Not enabled for JaaS Workers"
      />
    </Tooltip>,

    <DeleteAction key="delete" {...props} />,
  ]

  const summary =
    props.spec.isJaaSManager || props.spec.isJaaSWorkerHost ? (
      <DescriptionList groups={[...summaryGroups(demoMode, status.status, props), ...rest]} />
    ) : undefined

  return <DrawerContent summary={summary} raw={props} rightActions={rightActions} />
}
