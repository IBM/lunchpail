import { Button, Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core"

import { isHealthy } from "./Summary"
import { summaryGroups } from "./Card"
import { StatusCtxType } from "../../Status"

import camelCaseSplit from "../../util/camel-split"
import { dl, descriptionGroup } from "../DescriptionGroup"
import { descriptions } from "@jay/common/status/ControlPlaneStatus"

export default function Detail(demoMode: boolean, status: StatusCtxType) {
  const rest =
    demoMode || !status.status
      ? []
      : Object.entries(status.status).map(([key, value]) =>
          descriptionGroup(camelCaseSplit(key), value, undefined, descriptions[key]),
        )

  const init = () => status.setTo("updating")
  const destroy = () => status.setTo("destroying")

  const actions =
    status.status && isHealthy(status.status) ? (
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button
              key="update"
              variant="secondary"
              onClick={init}
              isLoading={status.refreshing === "initializing" || status.refreshing === "updating"}
            >
              {status.refreshing === "updating" ? "Updating" : "Update"}
            </Button>
          </ToolbarItem>

          <ToolbarItem>
            <Button key="destroy" variant="danger" onClick={destroy} isLoading={status.refreshing === "destroying"}>
              {status.refreshing === "destroying" ? "Destroying" : "Destroy"}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    ) : undefined

  const body = dl([...summaryGroups(demoMode, status.status), ...rest])

  return { actions, body }
}
