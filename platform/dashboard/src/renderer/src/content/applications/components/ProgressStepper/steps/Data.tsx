import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import { LinkToNewDataSet } from "@jaas/resources/datasets/components/New/Button"
import { groupSingular as singular } from "@jaas/resources/applications/group"
import { singular as datasetSingular } from "@jaas/resources/datasets/name"

import type Step from "../Step"
import { datasets } from "@jaas/resources/applications/components/taskqueueProps"

const step: Step = {
  id: "Data",
  variant: (props) => (datasets(props).length > 0 ? "success" : "default"),
  content: (props, onClick) => {
    const data = datasets(props)
    if (data.length === 0) {
      const body = (
        <span>
          If your {singular} needs access to a {datasetSingular}, link it in.{" "}
        </span>
      )

      const footer = <LinkToNewDataSet isInline action="create" onClick={onClick} />

      return { body, footer }
    } else {
      return (
        <span>
          Your {singular} has access to {data.length === 1 ? "this" : "these"} {datasetSingular}:
          <div>{linkToAllDetails("datasets", data, undefined, onClick)}</div>
        </span>
      )
    }
  },
}

export default step
