import { useCallback } from "react"
import camelCaseSplit from "@jaas/renderer/util/camel-split"
import { Spinner, Switch, Tooltip } from "@patternfly/react-core"

import DrawerContent from "@jaas/components/Drawer/Content"

import { summaryGroups } from "./Card"
import { status } from "./HealthBadge"

import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"
import { descriptions } from "@jaas/common/status/ControlPlaneStatus"

import { singular as computetarget } from "@jaas/renderer/content/computetargets/name"
import { name as computepools, singular as computepool } from "@jaas/renderer/content/workerpools/name"

import DeleteAction from "./actions/delete"

import type Props from "./Props"

export default function JobManagerDetail(props: Props) {
  const rest = !props.spec.jaasManager
    ? []
    : Object.entries(props.spec.jaasManager).map(([key, value]) =>
        descriptionGroup(camelCaseSplit(key), value, undefined, descriptions[key]),
      )

  const toggle = useCallback(
    () =>
      props.spec.isJaaSWorkerHost
        ? window.jaas.controlplane.destroy(props.metadata.name)
        : window.jaas.controlplane.init(props.metadata.name),
    [props.spec.isJaaSWorkerHost, window.jaas.controlplane.destroy, window.jaas.controlplane.init],
  )

  const currentStatus = status(props)

  const tooltip =
    currentStatus === "destroying"
      ? `Removing JaaS support from this ${computetarget}`
      : currentStatus === "initializing"
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
        isDisabled={currentStatus === "initializing" || currentStatus === "destroying"}
        data-ouia-component-id="comptueTargetEnableSwitch"
        isChecked={props.spec.isJaaSWorkerHost}
        label={
          currentStatus === "destroying" ? (
            <>
              <Spinner size="sm" />
              Deprovisioning
            </>
          ) : currentStatus === "initializing" ? (
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
    !!props.spec.jaasManager || props.spec.isJaaSWorkerHost ? (
      <DescriptionList groups={[...summaryGroups(props), ...rest]} />
    ) : undefined

  return <DrawerContent summary={summary} raw={props} rightActions={rightActions} />
}
