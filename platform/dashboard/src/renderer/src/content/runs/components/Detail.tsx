import { useMemo } from "react"

import DrawerContent from "@jaas/components/Drawer/Content"

import { datasets } from "@jaas/resources/applications/components/datasets"
import { datasetsGroup } from "@jaas/resources/applications/components/tabs/Data"
import { reasonAndMessageGroups } from "@jaas/resources/workerpools/components/tabs/Summary"

import workstealerLogsTab from "@jaas/resources/runs/components/tabs/Logs"
//import burndownTab from "@jaas/resources/applications/components/tabs/Burndown"

// import editAction from "@jaas/resources/applications/components/actions/edit"
// import cloneAction from "@jaas/resources/applications/components/actions/clone"
import deleteAction from "./actions/delete"

import { singular as Code } from "@jaas/resources/applications/name"
import { group as Compute } from "@jaas/resources/workerpools/group"
import { group as Dispatch } from "@jaas/resources/workdispatchers/group"
import { dl, descriptionGroup } from "@jaas/components/DescriptionGroup"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import type Props from "./Props"
import type { PropsWithPotentiallyMissingApplication } from "./Props"

function hasApplication(props: PropsWithPotentiallyMissingApplication): props is Props {
  return !!props.application
}

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: PropsWithPotentiallyMissingApplication) {
  return !hasApplication(props) ? [] : [workstealerLogsTab(props)]
}

function computeGroup(props: Pick<Props, "run" | "workerpools">) {
  const workerpools = props.workerpools.filter(
    (_) =>
      _.spec.run.name ===
      props.run.metadata.name /* && _.spec.application.namespace === props.application.metadata.namespace */,
  )
  return descriptionGroup(Compute, linkToAllDetails("workerpools", workerpools), workerpools.length)
}

function dispatchGroup(props: Pick<Props, "run" | "workdispatchers">) {
  const dispatchers = props.workdispatchers.filter(
    (_) =>
      _.spec.run ===
      props.run.metadata.name /* && _.spec.application.namespace === props.application.metadata.namespace */,
  )
  return descriptionGroup(Dispatch, linkToAllDetails("workdispatchers", dispatchers), dispatchers.length)
}

export default function ApplicationDetail(props: PropsWithPotentiallyMissingApplication) {
  const tabs = useMemo(() => otherTabs(props), [JSON.stringify(props)])
  const summary = useMemo(
    () =>
      dl({
        groups: [
          descriptionGroup(
            Code,
            !props.application ? "Missing" : linkToAllDetails("applications", [props.application]),
            1,
          ),
          ...(!hasApplication(props) ? [] : [datasetsGroup(datasets(props))]),
          dispatchGroup(props),
          computeGroup(props),
          ...reasonAndMessageGroups(props.run),
        ],
      }),
    [props],
  )

  return <DrawerContent summary={summary} raw={props.run} otherTabs={tabs} rightActions={[deleteAction(props)]} />
}
