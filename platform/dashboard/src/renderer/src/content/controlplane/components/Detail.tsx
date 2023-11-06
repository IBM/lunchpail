import { useContext } from "react"
import { Button, Tooltip } from "@patternfly/react-core"

import Status from "@jay/renderer/Status"
import Settings from "@jay/renderer/Settings"

import { summaryGroups } from "./Card"
import { isHealthy } from "./HealthBadge"
import DrawerContent from "@jay/components/Drawer/Content"

import camelCaseSplit from "@jay/renderer/util/camel-split"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"
import { descriptions } from "@jay/common/status/JobManagerStatus"

import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon"
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon"

export default function JobManagerDetail() {
  const status = useContext(Status)
  const settings = useContext(Settings)

  const demoMode = settings?.demoMode[0] ?? false

  const rest =
    demoMode || !status.status
      ? []
      : Object.entries(status.status).map(([key, value]) =>
          descriptionGroup(camelCaseSplit(key), value, undefined, descriptions[key]),
        )

  const init = () => status.setTo("updating")
  const destroy = () => status.setTo("destroying")

  const initButtonIsLoading = status.refreshing === "initializing" || status.refreshing === "updating"
  const destroyButtonIsLoading = status.refreshing === "destroying"

  const actions =
    status.status && isHealthy(status.status)
      ? [
          <Tooltip key="refresh" content="Reload the Job Manager with the latest configuration">
            <Button
              size="sm"
              variant="secondary"
              onClick={init}
              isLoading={initButtonIsLoading}
              icon={initButtonIsLoading ? <></> : <SyncIcon />}
            >
              {status.refreshing === "updating" ? "Refreshing" : "Refresh"}
            </Button>
          </Tooltip>,
        ]
      : undefined

  const rightActions = actions
    ? [
        <Tooltip key="delete" content="Deprovision the Job Manager">
          <Button
            size="sm"
            variant="danger"
            onClick={destroy}
            isLoading={destroyButtonIsLoading}
            icon={destroyButtonIsLoading ? <></> : <TrashIcon />}
          >
            {status.refreshing === "destroying" ? "Deprovisioning" : "Deprovision"}
          </Button>
        </Tooltip>,
      ]
    : undefined

  const summary = <DescriptionList groups={[...summaryGroups(demoMode, status.status), ...rest]} />

  return <DrawerContent summary={summary} actions={actions} rightActions={rightActions} />
}
