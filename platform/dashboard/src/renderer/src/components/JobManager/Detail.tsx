import { Button } from "@patternfly/react-core"

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
  return (
    <Settings.Consumer>
      {(settings) => (
        <Status.Consumer>
          {(status) => {
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
                    <Button
                      size="sm"
                      key="update"
                      variant="secondary"
                      onClick={init}
                      isLoading={initButtonIsLoading}
                      icon={initButtonIsLoading ? <></> : <SyncIcon />}
                    >
                      {status.refreshing === "updating" ? "Updating" : "Update"}
                    </Button>,

                    <Button
                      size="sm"
                      key="destroy"
                      variant="danger"
                      onClick={destroy}
                      isLoading={destroyButtonIsLoading}
                      icon={destroyButtonIsLoading ? <></> : <TrashIcon />}
                    >
                      {status.refreshing === "destroying" ? "Destroying" : "Destroy"}
                    </Button>,
                  ]
                : undefined

            const body = dl([...summaryGroups(demoMode, status.status), ...rest])

            return <DrawerContent body={body} actions={actions} />
          }}
        </Status.Consumer>
      )}
    </Settings.Consumer>
  )
}
