import { useContext } from "react"
import { Button, Tooltip } from "@patternfly/react-core"

import Status from "../../Status"
import Settings from "../../Settings"

import { isHealthy } from "./Summary"
import { summaryGroups } from "./Card"
import DrawerContent from "../Drawer/Content"

import camelCaseSplit from "../../util/camel-split"
import { dl, descriptionGroup } from "../DescriptionGroup"
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
          <Tooltip key="refresh" content="Reload the Job Manager with the initial configuration">
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

          <Tooltip key="delete" content="Deprovision the Job Manager">
            <Button
              size="sm"
              variant="danger"
              onClick={destroy}
              isLoading={destroyButtonIsLoading}
              icon={destroyButtonIsLoading ? <></> : <TrashIcon />}
            >
              {status.refreshing === "destroying" ? "Deleting" : "Delete"}
            </Button>
          </Tooltip>,
        ]
      : undefined

  const body = dl([...summaryGroups(demoMode, status.status), ...rest])

  return <DrawerContent body={body} actions={actions} />
}
